import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { inventoryApi, ApiError } from './services/api';
import type {
  Producto,
  ProductoInput,
  FacturaInput,
  FilterCategory,
  FilterStock,
  ViewMode,
  Usuario,
  ToastMessage,
  CategoriaProducto,
} from './types';
import { Header } from './components/Header';
import { AtelierStatusBar } from './components/AtelierStatusBar';
import { ProductToolbar } from './components/ProductToolbar';
import { ProductTable } from './components/ProductTable';
import { ProductGrid } from './components/ProductGrid';
import { LowStockDrawer } from './components/LowStockDrawer';
import { ProductModal } from './components/ProductModal';
import { QuickSaleModal } from './components/QuickSaleModal';
import { LoginScreen } from './components/LoginScreen';
import { TableSkeleton, EmptyState, ErrorBanner, DeleteConfirmModal, DemoNoticeBanner } from './components/StateViews';
import { ToastContainer } from './components/ToastContainer';
import { DEMO_ADMIN_USER, demoStore } from './services/demoData';
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

  // Inventory Data State
  const [products, setProducts] = useState<Producto[]>([]);
  const [totalInventory, setTotalInventory] = useState<number>(0);
  const [lowStockProducts, setLowStockProducts] = useState<Producto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & UI Mode
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('TODAS');
  const [selectedStockFilter, setSelectedStockFilter] = useState<FilterStock>('TODOS');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [updatingStockId, setUpdatingStockId] = useState<number | null>(null);

  // Modals & Panels
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isLowStockDrawerOpen, setIsLowStockDrawerOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Producto | null>(null);

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
      // Never fetch inventory data if unauthenticated
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

      // Fetch inventory datasets in parallel
      const [prods, total, lowStock] = await Promise.all([
        inventoryApi.getProducts(currentDemoState),
        inventoryApi.getTotalInventory(currentDemoState),
        inventoryApi.getLowStockProducts(currentDemoState),
      ]);

      setProducts(prods);
      setTotalInventory(total);
      setLowStockProducts(lowStock);
      if (!currentDemoState) {
        setBackendOnline(true);
      }
    } catch (err: any) {
      console.error('Error fetching inventory:', err);
      if (err instanceof ApiError && err.status === 401) {
        setUser(null);
        setError('Tu sesión de administradora ha expirado. Por favor inicia sesión nuevamente.');
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
            // Unauthenticated: ensure user is null, show login screen
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

  // Demo Mode Switch (Available only for authenticated admins)
  const handleToggleDemo = () => {
    if (!user) return;
    const newDemoMode = !isDemo;
    setIsDemo(newDemoMode);
    localStorage.setItem('dunamis_mode', newDemoMode ? 'demo' : 'live');
    addToast(
      'info',
      newDemoMode ? 'Modo Demostración Activo' : 'Conectando con Backend',
      newDemoMode
        ? 'Utilizando catálogo local de pruebas con referencias cosméticas precargadas.'
        : 'Intentando comunicarse con el backend Spring Boot en http://localhost:8080.'
    );
    void loadData(newDemoMode, user);
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
      `Bienvenida al Atelier, ${loggedUser.fullName || loggedUser.username}.`
    );
    await loadData(isDemo, loggedUser);
  };

  // Demo Entry Handler (Without requiring password or backend)
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
      'Se recargaron las 12 referencias cosméticas iniciales de prueba.'
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
      addToast('info', 'Sesión Finalizada', 'Has cerrado sesión correctamente.');
    }
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

  const handleQuickSale = async (facturaInput: FacturaInput) => {
    const res = await inventoryApi.createInvoice(facturaInput, isDemo);
    addToast(
      'success',
      'Factura Emitida',
      `Venta registrada con éxito (#${res.id}). El stock ha sido descontado automáticamente.`
    );
    await loadData(isDemo, user);
  };

  // Filtered products calculation
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      // 1. Search query (name or id)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = prod.nombre.toLowerCase().includes(query);
        const matchesId = prod.id.toString().includes(query);
        if (!matchesName && !matchesId) return false;
      }

      // 2. Category filter
      if (selectedCategory !== 'TODAS' && prod.categoria !== selectedCategory) {
        return false;
      }

      // 3. Stock status filter
      if (selectedStockFilter !== 'TODOS') {
        const initial = prod.cantidadInicial || prod.cantidad || 1;
        const isCritical = prod.cantidad <= initial * 0.1;
        if (selectedStockFilter === 'CRITICO' && !isCritical) return false;
        if (selectedStockFilter === 'SALUDABLE' && isCritical) return false;
      }

      return true;
    });
  }, [products, searchQuery, selectedCategory, selectedStockFilter]);

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

  // Authenticated: Show the main inventory dashboard
  return (
    <div className="app-layout">
      {/* Header */}
      <Header
        user={user}
        isDemo={isDemo}
        backendOnline={backendOnline}
        isLoading={isLoading}
        onToggleDemo={handleToggleDemo}
        onLogout={handleLogout}
        onRefresh={() => loadData(isDemo, user)}
      />

      <main className="main-content">
        {/* Visible Spanish notice for demo mode */}
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

        {/* Atelier Status Bar / Pulse */}
        <AtelierStatusBar
          totalInventory={totalInventory}
          products={products}
          lowStockProducts={lowStockProducts}
          onOpenLowStockDrawer={() => setIsLowStockDrawerOpen(true)}
          onSelectCategory={(cat: CategoriaProducto) => {
            setSelectedCategory(cat);
          }}
        />

        {/* Toolbar */}
        <ProductToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          selectedStockFilter={selectedStockFilter}
          onSelectStockFilter={setSelectedStockFilter}
          viewMode={viewMode}
          onToggleViewMode={setViewMode}
          onOpenCreateModal={handleOpenCreateModal}
          onOpenSaleModal={() => setIsSaleModalOpen(true)}
          criticalCount={lowStockProducts.length}
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
                ? 'Aún no se han registrado productos cosméticos en este catálogo. Comienza añadiendo el primero.'
                : 'No hay productos que coincidan con los filtros seleccionados o el término de búsqueda.'
            }
            actionText={
              products.length === 0 ? '+ Registrar primer producto' : 'Restablecer filtros'
            }
            onAction={
              products.length === 0
                ? handleOpenCreateModal
                : () => {
                    setSearchQuery('');
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
          />
        ) : (
          <ProductGrid
            products={filteredProducts}
            onEdit={handleOpenEditModal}
            onDelete={(prod) => setDeletingProduct(prod)}
            onQuickAdjustStock={handleQuickAdjustStock}
            updatingStockId={updatingStockId}
          />
        )}
      </main>

      {/* Slide-over Drawer for Low Stock */}
      <LowStockDrawer
        isOpen={isLowStockDrawerOpen}
        onClose={() => setIsLowStockDrawerOpen(false)}
        lowStockProducts={lowStockProducts}
        onRestockProduct={handleRestock}
      />

      {/* Product Create / Edit Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSubmit={handleSaveProduct}
        editingProduct={editingProduct}
      />

      {/* Quick Sale / Invoice Modal */}
      <QuickSaleModal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        products={products}
        onSaleSuccess={handleQuickSale}
      />

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
