import React from 'react';
import { Search, X, Plus, AlertTriangle, LayoutGrid, Table, Sparkles } from 'lucide-react';
import type { FilterCategory, FilterStock, ViewMode, Marca, Categoria } from '../types';

interface ProductToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedBrand: number | 'TODAS';
  onSelectBrand: (brandId: number | 'TODAS') => void;
  brands: Marca[];
  categories?: Categoria[];
  selectedCategory: FilterCategory;
  onSelectCategory: (cat: FilterCategory) => void;
  selectedStockFilter: FilterStock;
  onSelectStockFilter: (stock: FilterStock) => void;
  viewMode: ViewMode;
  onToggleViewMode: (mode: ViewMode) => void;
  onOpenCreateModal?: () => void;
  criticalCount: number;
  onOpenLowStockDrawer: () => void;
  isAdmin?: boolean;
  mostrarInactivos?: boolean;
  onToggleMostrarInactivos?: (mostrar: boolean) => void;
}

export const ProductToolbar: React.FC<ProductToolbarProps> = ({
  searchQuery,
  onSearchChange,
  selectedBrand,
  onSelectBrand,
  brands,
  categories = [],
  selectedCategory,
  onSelectCategory,
  selectedStockFilter,
  onSelectStockFilter,
  viewMode,
  onToggleViewMode,
  onOpenCreateModal,
  criticalCount,
  onOpenLowStockDrawer,
  isAdmin = true,
  mostrarInactivos = false,
  onToggleMostrarInactivos,
}) => {
  const activeCategories = (categories && categories.length > 0 ? categories : []).filter(
    (c) => c.activa !== false
  );

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedBrand !== 'TODAS' ||
    selectedCategory !== 'TODAS' ||
    selectedStockFilter !== 'TODOS';

  const handleResetAllFilters = () => {
    onSearchChange('');
    onSelectBrand('TODAS');
    onSelectCategory('TODAS');
    onSelectStockFilter('TODOS');
  };

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-card)',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.95rem',
      }}
      aria-label="Controles y filtros de inventario"
    >
      {/* Fila 1: Búsqueda y Acciones Rápidas */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.85rem',
        }}
      >
        {/* Input de Búsqueda */}
        <div
          style={{
            position: 'relative',
            flex: '1 1 280px',
            minWidth: '240px',
            maxWidth: '460px',
          }}
        >
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '0.85rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-subtle)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            className="form-input"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nombre, marca o Ref #..."
            style={{
              paddingLeft: '2.35rem',
              paddingRight: searchQuery ? '2.2rem' : '0.85rem',
              height: '2.45rem',
              backgroundColor: 'var(--color-canvas)',
              fontSize: '0.85rem',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              title="Borrar búsqueda"
              style={{
                position: 'absolute',
                right: '0.65rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-subtle)',
                padding: '0.2rem',
                borderRadius: '50%',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Acciones del lado derecho: Alertas + Vistas + Botón Registrar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {/* Alerta de Críticos / Agotados */}
          {criticalCount > 0 && (
            <button
              type="button"
              onClick={onOpenLowStockDrawer}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-crimson-light)',
                border: '1px solid var(--color-crimson-border)',
                color: 'var(--color-crimson)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all var(--transition-fast)',
              }}
              title="Abrir panel de reposición urgente para productos agotados"
            >
              <AlertTriangle size={14} />
              <span>{criticalCount} agotado(s)</span>
            </button>
          )}

          {/* Toggle Activos / Inactivos (Admin) */}
          {isAdmin && onToggleMostrarInactivos && (
            <div
              style={{
                display: 'inline-flex',
                backgroundColor: 'var(--color-rose-subtle)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '0.15rem',
                gap: '0.15rem',
              }}
            >
              <button
                type="button"
                onClick={() => onToggleMostrarInactivos(false)}
                style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: !mostrarInactivos ? '#FFFFFF' : 'transparent',
                  color: !mostrarInactivos ? 'var(--color-rosewood-deep)' : 'var(--color-text-muted)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  boxShadow: !mostrarInactivos ? 'var(--shadow-subtle)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Activos
              </button>
              <button
                type="button"
                onClick={() => onToggleMostrarInactivos(true)}
                style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: mostrarInactivos ? '#FFFFFF' : 'transparent',
                  color: mostrarInactivos ? 'var(--color-rosewood-deep)' : 'var(--color-text-muted)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  boxShadow: mostrarInactivos ? 'var(--shadow-subtle)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Todos (con inactivos)
              </button>
            </div>
          )}

          {/* Selector de Vista: Tabla vs Fichas */}
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: 'var(--color-rose-subtle)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.15rem',
              gap: '0.15rem',
            }}
          >
            <button
              type="button"
              onClick={() => onToggleViewMode('table')}
              title="Vista de tabla"
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: viewMode === 'table' ? '#FFFFFF' : 'transparent',
                color: viewMode === 'table' ? 'var(--color-rosewood-deep)' : 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                boxShadow: viewMode === 'table' ? 'var(--shadow-subtle)' : 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <Table size={14} />
              <span className="hidden sm:inline">Tabla</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleViewMode('grid')}
              title="Vista de fichas"
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: viewMode === 'grid' ? '#FFFFFF' : 'transparent',
                color: viewMode === 'grid' ? 'var(--color-rosewood-deep)' : 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                boxShadow: viewMode === 'grid' ? 'var(--shadow-subtle)' : 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <LayoutGrid size={14} />
              <span className="hidden sm:inline">Fichas</span>
            </button>
          </div>

          {/* Botón Principal: Registrar Producto */}
          {isAdmin && onOpenCreateModal && (
            <button
              type="button"
              className="btn-primary"
              onClick={onOpenCreateModal}
              title="Registrar nueva referencia cosmética"
              style={{
                padding: '0.45rem 1rem',
                fontSize: '0.825rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                whiteSpace: 'nowrap',
              }}
            >
              <Plus size={16} />
              <span>Registrar producto</span>
            </button>
          )}
        </div>
      </div>

      {/* Fila 2: Filtros Desplegables Unificados (Categoría, Marca, Existencias) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.85rem',
          borderTop: '1px solid var(--color-border-subtle)',
          paddingTop: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {/* 1. Categoría (Escalable a 200+ categorías) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <label htmlFor="filter-cat-select" style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
              Categoría:
            </label>
            <select
              id="filter-cat-select"
              className="form-select"
              value={selectedCategory}
              onChange={(e) => onSelectCategory(e.target.value)}
              style={{
                padding: '0.35rem 0.65rem',
                height: '2.35rem',
                fontSize: '0.825rem',
                minWidth: '170px',
                backgroundColor: selectedCategory !== 'TODAS' ? 'var(--color-rose-soft)' : '#FFFFFF',
                borderColor: selectedCategory !== 'TODAS' ? 'var(--color-rosewood)' : 'var(--color-border)',
                color: selectedCategory !== 'TODAS' ? 'var(--color-rosewood-deep)' : 'var(--color-text-main)',
                fontWeight: selectedCategory !== 'TODAS' ? 600 : 500,
              }}
            >
              <option value="TODAS">
                Todas las categorías ({activeCategories.length})
              </option>
              {activeCategories.map((c) => (
                <option key={c.id} value={c.nombre}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Marca */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <label htmlFor="filter-brand-select" style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
              Marca:
            </label>
            <select
              id="filter-brand-select"
              className="form-select"
              value={selectedBrand}
              onChange={(e) => {
                const val = e.target.value;
                onSelectBrand(val === 'TODAS' ? 'TODAS' : Number(val));
              }}
              style={{
                padding: '0.35rem 0.65rem',
                height: '2.35rem',
                fontSize: '0.825rem',
                minWidth: '150px',
                backgroundColor: selectedBrand !== 'TODAS' ? 'var(--color-rose-soft)' : '#FFFFFF',
                borderColor: selectedBrand !== 'TODAS' ? 'var(--color-rosewood)' : 'var(--color-border)',
                color: selectedBrand !== 'TODAS' ? 'var(--color-rosewood-deep)' : 'var(--color-text-main)',
                fontWeight: selectedBrand !== 'TODAS' ? 600 : 500,
              }}
            >
              <option value="TODAS">Todas las marcas ({brands.length})</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Existencias */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <label htmlFor="filter-stock-select" style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
              Existencias:
            </label>
            <select
              id="filter-stock-select"
              value={selectedStockFilter}
              onChange={(e) => onSelectStockFilter(e.target.value as FilterStock)}
              className="form-select"
              style={{
                padding: '0.35rem 0.65rem',
                height: '2.35rem',
                fontSize: '0.825rem',
                minWidth: '145px',
                backgroundColor: selectedStockFilter !== 'TODOS' ? 'var(--color-rose-soft)' : '#FFFFFF',
                borderColor: selectedStockFilter !== 'TODOS' ? 'var(--color-rosewood)' : 'var(--color-border)',
                color: selectedStockFilter !== 'TODOS' ? 'var(--color-rosewood-deep)' : 'var(--color-text-main)',
                fontWeight: selectedStockFilter !== 'TODOS' ? 600 : 500,
              }}
            >
              <option value="TODOS">Todos los estados</option>
              <option value="DISPONIBLES">Disponibles (&gt;0 uds.)</option>
              <option value="AGOTADOS">
                Agotados (0 uds.{criticalCount > 0 ? ` · ${criticalCount}` : ''})
              </option>
            </select>
          </div>
        </div>

        {/* Botón para Limpiar filtros activos */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetAllFilters}
            className="btn-ghost"
            style={{
              fontSize: '0.78rem',
              padding: '0.25rem 0.65rem',
              color: 'var(--color-rosewood)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
            title="Restablecer búsqueda y todos los filtros"
          >
            <Sparkles size={13} />
            <span>Limpiar filtros</span>
          </button>
        )}
      </div>
    </div>
  );
};
