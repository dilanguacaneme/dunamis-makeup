import React from 'react';
import { Search, X, Plus, AlertTriangle, LayoutGrid, Table, Sparkles } from 'lucide-react';
import type { FilterCategory, FilterStock, ViewMode, Marca } from '../types';

interface ProductToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedBrand: number | 'TODAS';
  onSelectBrand: (brandId: number | 'TODAS') => void;
  brands: Marca[];
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
}

export const ProductToolbar: React.FC<ProductToolbarProps> = ({
  searchQuery,
  onSearchChange,
  selectedBrand,
  onSelectBrand,
  brands,
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
}) => {
  const categories: { key: FilterCategory; label: string }[] = [
    { key: 'TODAS', label: 'Todas las zonas' },
    { key: 'ROSTRO', label: 'Rostro' },
    { key: 'CEJAS', label: 'Cejas' },
    { key: 'LABIOS', label: 'Labios' },
    { key: 'OJOS', label: 'Ojos' },
  ];

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
        gap: '1rem',
      }}
      aria-label="Controles y filtros de inventario"
    >
      {/* Row 1: Search + Combined Select Filters + Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.85rem',
        }}
      >
        {/* 1. Search input */}
        <div
          style={{
            position: 'relative',
            flex: '1 1 240px',
            minWidth: '220px',
            maxWidth: '380px',
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

        {/* 2. Brand Filter Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flex: '0 1 auto' }}>
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
              height: '2.45rem',
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

        {/* 3. Stock Status Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flex: '0 1 auto' }}>
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
              height: '2.45rem',
              fontSize: '0.825rem',
              minWidth: '140px',
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

        {/* View Mode Toggle (Table vs Grid) */}
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
              transition: 'all var(--transition-fast)',
            }}
          >
            <LayoutGrid size={14} />
            <span className="hidden sm:inline">Fichas</span>
          </button>
        </div>

        {/* Critical Alert Quick Trigger (if any agotados) */}
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

        {/* New Product CTA (Contextual to inventory, Admin only) */}
        {isAdmin && onOpenCreateModal && (
          <button
            type="button"
            className="btn-primary"
            onClick={onOpenCreateModal}
            title="Registrar nueva referencia cosmética"
            style={{ padding: '0.45rem 0.95rem', fontSize: '0.825rem' }}
          >
            <Plus size={15} />
            <span>Registrar producto</span>
          </button>
        )}
      </div>

      {/* Row 2: Unified Cosmetic Zone Filter Chips (Filtered once in the whole view) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.65rem',
          borderTop: '1px solid var(--color-border-subtle)',
          paddingTop: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)', marginRight: '0.2rem' }}>
            Zona cosmética:
          </span>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => onSelectCategory(cat.key)}
                style={{
                  fontSize: '0.78rem',
                  fontWeight: isSelected ? 700 : 500,
                  padding: '0.25rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid',
                  backgroundColor: isSelected ? 'var(--color-rosewood)' : 'var(--color-surface)',
                  borderColor: isSelected ? 'var(--color-rosewood)' : 'var(--color-border)',
                  color: isSelected ? '#FFFFFF' : 'var(--color-text-main)',
                  transition: 'all var(--transition-fast)',
                  cursor: 'pointer',
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Reset filters shortcut button if any filter is active */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetAllFilters}
            className="btn-ghost"
            style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', color: 'var(--color-rosewood)' }}
            title="Restablecer búsqueda y todos los filtros"
          >
            <Sparkles size={12} />
            <span>Limpiar todos los filtros</span>
          </button>
        )}
      </div>
    </div>
  );
};
