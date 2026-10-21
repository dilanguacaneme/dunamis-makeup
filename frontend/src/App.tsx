import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { inventoryApi, ApiError } from './services/api';
import type {
  Producto,
  ProductoInput,
  FacturaInput,
  Factura,
  Marca,
  MarcaInput,
  FilterCategory,
  FilterStock,
  ViewMode,
  ActiveTab,
  Usuario,
  ToastMessage,
} from './types';
import { Sidebar } from './components/Sidebar';
import { MobileHeader } from './components/MobileHeader';
import { DesktopTopBar } from './components/DesktopTopBar';
import { AtelierStatusBar } from './components/AtelierStatusBar';
import { ProductToolbar } from './components/ProductToolbar';
import { ProductTable } from './components/ProductTable';
import { ProductGrid } from './components/ProductGrid';
import { LowStockDrawer } from './components/LowStockDrawer';
import { ProductModal } from './components/ProductModal';
import { QuickSaleModal } from './components/QuickSaleModal';
import { LoginScreen } from './components/LoginScreen';
import { InvoiceHistoryView } from './components/InvoiceHistoryView';
import { InvoiceDetailModal } from './components/InvoiceDetailModal';
import { MonthlySalesView } from './components/MonthlySalesView';
import { BrandManagementModal } from './components/BrandManagementModal';
import { BrandManagementView } from './components/BrandManagementView';
import { TableSkeleton, EmptyState, ErrorBanner, DeleteConfirmModal, DemoNoticeBanner } from './components/StateViews';
import { ToastContainer } from './components/ToastContainer';
import { DEMO_ADMIN_USER, DEMO_SELLER_USER, demoStore } from './services/demoData';
import { Sparkles } from 'lucide-react';
import './styles/theme.css';

export const App: React.FC = () => {
  // Authentication & Session State
  const [user, setUser] = useState<Usuario | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [isDemo, setIsDemo] = useState<boolean>(() => {
    return localStorage.getItem('dunamis_mode') === 'demo';
  });

  // Navigation tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('inventory');

  // Mobile drawer state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Inventory Data State
  const [products, setProducts] = useState<Producto[]>([]);
  const [totalInventory, setTotalInventory] = useState<number>(0);
  const [lowStockProducts, setLowStockProducts] = useState<Producto[]>([]);
  const [brands, setBrands] = useState<Marca[]>([]);
  const [invoices, setInvoices] = useState<Factura[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & UI Mode
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<number | 'TODAS'>('TODAS');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('TODAS');
  const [selectedStockFilter, setSelectedStockFilter] = useState<FilterStock>('TODOS');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [updatingStockId, setUpdatingStockId] = useState<number | null>(null);

  // Modals & Panels
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isLowStockDrawerOpen, setIsLowStockDrawerOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Producto | null>(null);
  const [viewingInvoiceId, setViewingInvoiceId] = useState<number | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const isAdmin = user?.role === 'ADMIN';

  // Health check helper
  const refreshBackendHealth = useCallback(async () => {
    try {
      const health = await inventoryApi.checkBackendHealth();
      setBackendOnline(health.online);
    } catch {
      setBackendOnline(false);
    }
  }, []);

  // Data Loading for authenticated dashboard
  const loadData = useCallback(async (currentDemoState: boolean, currentUser?: Usuario | null) => {
    const activeUser = currentUser !== undefined ? currentUser : user;
    if (!activeUser) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!currentDemoState) {
        const health = await inventoryApi.checkBackendHealth();
        setBackendOnline(health.online);

        if (!health.online) {
          setError(
            'No se logró establecer conexión con el backend Spring Boot en http://localhost:8080. Puedes reintentar o activar el modo de demostración para gestionar datos locales de prueba.'
          );
          setIsLoading(false);
          return;
        }
      }

      // Fetch datasets in parallel
      const [prods, total, lowStock, brandsList, invoicesList] = await Promise.all([
        inventoryApi.getProducts(currentDemoState),
        inventoryApi.getTotalInventory(currentDemoState),
        inventoryApi.getLowStockProducts(currentDemoState),
        inventoryApi.getBrands(currentDemoState),
        inventoryApi.getInvoices(currentDemoState, activeUser.role, activeUser.username),
      ]);

      setProducts(prods);
      setTotalInventory(total);
      setLowStockProducts(lowStock);
      setBrands(brandsList);
      setInvoices(invoicesList);

      if (!currentDemoState) {
        setBackendOnline(true);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      if (err instanceof ApiError && err.status === 401) {
        setUser(null);
        setError('Tu sesión en el Atelier ha expirado. Por favor inicia sesión nuevamente.');
      } else {
        setError(err.message || 'Error al comunicarse con el servidor.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Initial Authentication Gate Verification
  useEffect(() => {
    let isMounted = true;

    const checkInitialSession = async () => {
      setIsAuthChecking(true);
      try {
        const health = await inventoryApi.checkBackendHealth();
        if (isMounted) setBackendOnline(health.online);

        // Check if an existing Spring Security session is active
        const existingUser = await inventoryApi.getCurrentUser(false);
        if (existingUser && isMounted) {
          setUser(existingUser);
          const savedDemoMode = localStorage.getItem('dunamis_mode') === 'demo';
          setIsDemo(savedDemoMode);
          await loadData(savedDemoMode, existingUser);
        } else if (isMounted) {
          const savedDemoActive = localStorage.getItem('dunamis_demo_active') === 'true';
          if (savedDemoActive) {
            setUser(DEMO_ADMIN_USER);
            setIsDemo(true);
            await loadData(true, DEMO_ADMIN_USER);
          } else {
            setUser(null);
          }
        }
      } catch {
        if (isMounted) {
          const savedDemoActive = localStorage.getItem('dunamis_demo_active') === 'true';
          if (savedDemoActive) {
            setUser(DEMO_ADMIN_USER);
            setIsDemo(true);
            await loadData(true, DEMO_ADMIN_USER);
          } else {
            setUser(null);
          }
        }
      } finally {
        if (isMounted) setIsAuthChecking(false);
      }
    };

    void checkInitialSession();

    return () => {
      isMounted = false;
    };
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Demo Mode Switch
  const handleToggleDemo = () => {
    if (!user) return;
    const newDemoMode = !isDemo;
    setIsDemo(newDemoMode);
    localStorage.setItem('dunamis_mode', newDemoMode ? 'demo' : 'live');
    addToast(
      'info',
      newDemoMode ? 'Modo Demostración Activo' : 'Conectando con Backend',
      newDemoMode
        ? 'Utilizando catálogo local de pruebas con marcas y facturas precargadas.'
        : 'Intentando comunicarse con el backend Spring Boot en http://localhost:8080.'
    );
    void loadData(newDemoMode, user);
  };

  // Demo Role Toggle helper (allows testing ADMIN vs VENDEDOR visibility locally)
  const handleToggleDemoRole = () => {
    if (!isDemo || !user) return;
    const nextUser = user.role === 'ADMIN' ? DEMO_SELLER_USER : DEMO_ADMIN_USER;
    setUser(nextUser);
    addToast(
      'info',
      'Rol de Demostración Cambiado',
      `Ahora estás navegando como ${nextUser.role === 'ADMIN' ? 'Administradora' : 'Vendedora'} (${nextUser.fullName}).`
    );
    void loadData(true, nextUser);
  };

  // Auth Handlers
  const handleLogin = async (username: string, pass: string) => {
    const loggedUser = await inventoryApi.login(username, pass, false);
    localStorage.removeItem('dunamis_demo_active');
    setUser(loggedUser);
    setBackendOnline(true);
    addToast(
      'success',
      'Sesión Iniciada',
      `Bienvenida al Atelier, ${loggedUser.fullName || loggedUser.username}. (${loggedUser.role === 'ADMIN' ? 'Administradora' : 'Vendedora'})`
    );
    await loadData(isDemo, loggedUser);
  };

  // Demo Entry Handler
  const handleEnterDemo = () => {
    setIsDemo(true);
    localStorage.setItem('dunamis_mode', 'demo');
    localStorage.setItem('dunamis_demo_active', 'true');
    setUser(DEMO_ADMIN_USER);
    void loadData(true, DEMO_ADMIN_USER);
    addToast(
      'info',
      'Modo Demostración Activo',
      'Has ingresado al Atelier con datos ficticios locales. No se requiere conexión con el backend.'
    );
  };

  // Reset Demo Catalog
  const handleResetDemoData = async () => {
    demoStore.resetToDefaults();
    await loadData(true, user || DEMO_ADMIN_USER);
    addToast(
      'info',
      'Catálogo Demostración Restablecido',
      'Se recargaron los productos, marcas sembradas y facturas iniciales de prueba.'
    );
  };

  const handleLogout = async () => {
    try {
      await inventoryApi.logout(isDemo);
    } finally {
      setUser(null);
      localStorage.removeItem('dunamis_mode');
      localStorage.removeItem('dunamis_demo_active');
      setIsDemo(false);
      setProducts([]);
      setTotalInventory(0);
      setLowStockProducts([]);
      setBrands([]);
      setInvoices([]);
      addToast('info', 'Sesión Finalizada', 'Has cerrado sesión correctamente.');
    }
  };

  // Brand Operations (Admin-only surface)
  const handleCreateBrand = async (input: MarcaInput) => {
    await inventoryApi.createBrand(input, isDemo);
    addToast('success', 'Marca Creada', `Se registró la marca "${input.nombre}".`);
    await loadData(isDemo, user);
  };

  const handleUpdateBrand = async (id: number, input: Partial<MarcaInput>) => {
    await inventoryApi.updateBrand(id, input, isDemo);
    addToast(
      'success',
      'Marca Actualizada',
      input.activa === false
        ? 'Se ha desactivado la marca del catálogo.'
        : `Se actualizaron los datos de la marca #${id}.`
    );
    await loadData(isDemo, user);
  };

  const handleRefreshBrands = async () => {
    const list = await inventoryApi.getBrands(isDemo);
    setBrands(list);
  };

  // Product CRUD Handlers
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditModal = (prod: Producto) => {
    setEditingProduct(prod);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (input: ProductoInput, editingId?: number) => {
    if (editingId) {
      await inventoryApi.updateProduct(editingId, input, isDemo);
      addToast('success', 'Producto Modificado', `Se actualizaron los datos de "${input.nombre}".`);
    } else {
      await inventoryApi.createProduct(input, isDemo);
      addToast('success', 'Producto Registrado', `Se añadió "${input.nombre}" al inventario.`);
    }
    await loadData(isDemo, user);
  };

  const handleQuickAdjustStock = async (id: number, newCantidad: number) => {
    if (newCantidad < 0) return; // Strict prevent negative stock
    try {
      setUpdatingStockId(id);
      await inventoryApi.updateProduct(id, { cantidad: newCantidad }, isDemo);
      await loadData(isDemo, user);
    } catch (err: any) {
      addToast('error', 'Error de Stock', err.message || 'No se pudo actualizar la cantidad.');
    } finally {
      setUpdatingStockId(null);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    try {
      await inventoryApi.deleteProduct(deletingProduct.id, isDemo);
      addToast('info', 'Producto Eliminado', `Se eliminó "${deletingProduct.nombre}" del inventario.`);
      await loadData(isDemo, user);
    } catch (err: any) {
      addToast('error', 'Error al Eliminar', err.message || 'No se pudo borrar el producto.');
    }
  };

  const handleRestock = async (product: Producto, additionalQty: number) => {
    if (additionalQty <= 0) return;
    try {
      const newStock = product.cantidad + additionalQty;
      await inventoryApi.updateProduct(product.id, { cantidad: newStock }, isDemo);
      addToast(
        'success',
        'Reabastecimiento Registrado',
        `Se añadieron ${additionalQty} unidades a "${product.nombre}". Stock actual: ${newStock} uds.`
      );
      await loadData(isDemo, user);
    } catch (err: any) {
      addToast('error', 'Error de Reabastecimiento', err.message || 'No se pudo actualizar el stock.');
    }
  };

  // Invoice / Sale Handlers
  const handleQuickSale = async (facturaInput: FacturaInput) => {
    const res = await inventoryApi.createInvoice(facturaInput, isDemo, user);
    addToast(
      'success',
      'Factura Emitida',
      `Factura #${res.id} generada para "${res.cliente}". Existencias descontadas automáticamente.`
    );
    await loadData(isDemo, user);
  };

  // Filtered products calculation
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      // 1. Search query (name, id, or brand name)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = prod.nombre.toLowerCase().includes(query);
        const matchesId = prod.id.toString().includes(query);
        const matchesBrand = prod.marca?.nombre?.toLowerCase().includes(query) ?? false;
        if (!matchesName && !matchesId && !matchesBrand) return false;
      }

      // 2. Category filter
      if (selectedCategory !== 'TODAS' && prod.categoria !== selectedCategory) {
        return false;
      }

      // 3. Brand filter
      if (selectedBrand !== 'TODAS') {
        if (!prod.marca || prod.marca.id !== selectedBrand) {
          return false;
        }
      }

      // 4. Stock status filter (AGOTADOS = 0 uds, DISPONIBLES > 0 uds)
      if (selectedStockFilter === 'AGOTADOS' && prod.cantidad > 0) {
        return false;
      }
      if (selectedStockFilter === 'DISPONIBLES' && prod.cantidad <= 0) {
        return false;
      }

      return true;
    });
  }, [products, searchQuery, selectedCategory, selectedBrand, selectedStockFilter]);

  // Loading initial auth gate
  if (isAuthChecking) {
    return (
      <div className="login-screen-wrapper">
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '3.5rem',
              height: '3.5rem',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, var(--color-rosewood) 0%, var(--color-rosewood-deep) 100%)',
              color: '#FFFFFF',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(148, 73, 96, 0.3)',
              marginBottom: '1rem',
            }}
          >
            <Sparkles size={24} />
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.35rem',
              fontWeight: 700,
              color: 'var(--color-rosewood-deep)',
              marginBottom: '0.35rem',
            }}
          >
            Dunamis Makeup
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Verificando sesión en el Atelier...
          </p>
        </div>
      </div>
    );
  }

  // Unauthenticated: Show ONLY the dedicated login screen
  if (!user) {
    return (
      <>
        <LoginScreen
          onLogin={handleLogin}
          onEnterDemo={handleEnterDemo}
          isBackendOnline={backendOnline}
          onRefreshHealth={refreshBackendHealth}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  // Authenticated: Show the persistent responsive sidebar with main workspace
  return (
    <div className="app-layout">
      {/* Persistent Responsive Sidebar on Desktop / Off-canvas drawer on Mobile */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        productsCount={products.length}
        invoicesCount={invoices.length}
        brandsCount={brands.length}
        isAdmin={isAdmin}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Workspace Column */}
      <div className="app-main-column">
        {/* Mobile Header (< 1024px) with Hamburger Navigation */}
        <MobileHeader
          user={user}
          isDemo={isDemo}
          backendOnline={backendOnline}
          isLoading={isLoading}
          onOpenSidebar={() => setIsMobileSidebarOpen(true)}
          onToggleDemo={handleToggleDemo}
          onRefresh={() => loadData(isDemo, user)}
          onLogout={handleLogout}
        />

        {/* Desktop Workspace Context Bar (>= 1024px) */}
        <DesktopTopBar
          activeTab={activeTab}
          user={user}
          isDemo={isDemo}
          backendOnline={backendOnline}
          isLoading={isLoading}
          onRefresh={() => loadData(isDemo, user)}
          onToggleDemo={handleToggleDemo}
          onToggleDemoRole={isDemo ? handleToggleDemoRole : undefined}
          onLogout={handleLogout}
        />

        <main className="main-content">
          {/* Visible notice for demo mode */}
          {isDemo && (
            <DemoNoticeBanner onResetDefaults={handleResetDemoData} />
          )}

          {/* Error notification banner */}
          {error && (
            <ErrorBanner
              message={error}
              onRetry={() => loadData(false, user)}
              onUseDemo={() => {
                setIsDemo(true);
                localStorage.setItem('dunamis_mode', 'demo');
                void loadData(true, user);
              }}
            />
          )}

          {/* TAB 1: Inventory Management */}
          {activeTab === 'inventory' && (
            <>
              {/* Atelier Status Bar: single valuation metric */}
              <AtelierStatusBar
                totalInventory={totalInventory}
                totalSKUs={products.length}
              />

              {/* Consolidated single ordered group of controls */}
              <ProductToolbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedBrand={selectedBrand}
                onSelectBrand={setSelectedBrand}
                brands={brands}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                selectedStockFilter={selectedStockFilter}
                onSelectStockFilter={setSelectedStockFilter}
                viewMode={viewMode}
                onToggleViewMode={setViewMode}
                onOpenCreateModal={isAdmin ? handleOpenCreateModal : undefined}
                criticalCount={lowStockProducts.length}
                onOpenLowStockDrawer={() => setIsLowStockDrawerOpen(true)}
                isAdmin={isAdmin}
              />

              {/* Content presentation */}
              {isLoading ? (
                <TableSkeleton />
              ) : filteredProducts.length === 0 ? (
                <EmptyState
                  title={
                    products.length === 0
                      ? 'El inventario está actualmente vacío'
                      : 'No se encontraron referencias'
                  }
                  description={
                    products.length === 0
                      ? isAdmin
                        ? 'Aún no se han registrado productos cosméticos en este catálogo. Comienza añadiendo el primero.'
                        : 'El inventario está vacío actualmente. Consulta con la administración del Atelier.'
                      : 'No hay productos que coincidan con los filtros seleccionados o el término de búsqueda.'
                  }
                  actionText={
                    products.length === 0
                      ? isAdmin
                        ? '+ Registrar primer producto'
                        : undefined
                      : 'Restablecer filtros'
                  }
                  onAction={
                    products.length === 0
                      ? isAdmin
                        ? handleOpenCreateModal
                        : undefined
                      : () => {
                          setSearchQuery('');
                          setSelectedBrand('TODAS');
                          setSelectedCategory('TODAS');
                          setSelectedStockFilter('TODOS');
                        }
                  }
                />
              ) : viewMode === 'table' ? (
                <ProductTable
                  products={filteredProducts}
                  onEdit={handleOpenEditModal}
                  onDelete={(prod) => setDeletingProduct(prod)}
                  onQuickAdjustStock={handleQuickAdjustStock}
                  updatingStockId={updatingStockId}
                  isAdmin={isAdmin}
                />
              ) : (
                <ProductGrid
                  products={filteredProducts}
                  onEdit={handleOpenEditModal}
                  onDelete={(prod) => setDeletingProduct(prod)}
                  onQuickAdjustStock={handleQuickAdjustStock}
                  updatingStockId={updatingStockId}
                  isAdmin={isAdmin}
                />
              )}
            </>
          )}

          {/* TAB 2: Invoice History & Sales View */}
          {activeTab === 'invoices' && (
            <InvoiceHistoryView
              invoices={invoices}
              isLoading={isLoading}
              user={user}
              onOpenSaleModal={() => setIsSaleModalOpen(true)}
              onViewInvoiceDetails={(invoiceId) => setViewingInvoiceId(invoiceId)}
            />
          )}

          {/* TAB 3: Monthly Sales Report View */}
          {activeTab === 'monthly-sales' && (
            <MonthlySalesView
              invoices={invoices}
              isLoading={isLoading}
              isDemo={isDemo}
              onViewInvoiceDetails={(invoiceId) => setViewingInvoiceId(invoiceId)}
            />
          )}

          {/* TAB 4: Brand Management View */}
          {activeTab === 'brands' && (
            isAdmin ? (
              <BrandManagementView
                brands={brands}
                onCreateBrand={handleCreateBrand}
                onUpdateBrand={handleUpdateBrand}
                onRefreshBrands={handleRefreshBrands}
                isAdmin={isAdmin}
              />
            ) : (
              <EmptyState
                title="Acceso Restringido"
                description="La gestión de marcas cosméticas está reservada exclusivamente para usuarias con rol de Administradora."
                actionText="Volver al Inventario"
                onAction={() => setActiveTab('inventory')}
              />
            )
          )}
        </main>
      </div>

      {/* Slide-over Drawer for Agotados */}
      <LowStockDrawer
        isOpen={isLowStockDrawerOpen}
        onClose={() => setIsLowStockDrawerOpen(false)}
        lowStockProducts={lowStockProducts}
        onRestockProduct={handleRestock}
        isAdmin={isAdmin}
      />

      {/* Product Create / Edit Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSubmit={handleSaveProduct}
        editingProduct={editingProduct}
        brands={brands}
        onOpenBrandManagement={isAdmin ? () => setIsBrandModalOpen(true) : undefined}
        isAdmin={isAdmin}
      />

      {/* Quick Sale / Create Invoice Modal (Preserved base checkout) */}
      <QuickSaleModal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        products={products}
        onSaleSuccess={handleQuickSale}
        isDemo={isDemo}
      />

      {/* Invoice Detail & Print Modal */}
      <InvoiceDetailModal
        invoiceId={viewingInvoiceId}
        onClose={() => setViewingInvoiceId(null)}
        isDemo={isDemo}
        currentUser={user}
        onInvoiceUpdated={() => loadData(isDemo, user)}
      />

      {/* Admin-only Brand Management Modal (retained for modal triggers from ProductModal) */}
      {isAdmin && (
        <BrandManagementModal
          isOpen={isBrandModalOpen}
          onClose={() => setIsBrandModalOpen(false)}
          brands={brands}
          onCreateBrand={handleCreateBrand}
          onUpdateBrand={handleUpdateBrand}
          onRefreshBrands={handleRefreshBrands}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingProduct}
        product={deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleDeleteProduct}
      />

      {/* Toast feedback notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default App;
