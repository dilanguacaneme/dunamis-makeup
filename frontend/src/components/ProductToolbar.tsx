import React from 'react';
import { Search, X, Plus, ShoppingBag, LayoutGrid, Table } from 'lucide-react';
import type { FilterCategory, FilterStock, ViewMode } from '../types';

interface ProductToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: FilterCategory;
  onSelectCategory: (cat: FilterCategory) => void;
  selectedStockFilter: FilterStock;
  onSelectStockFilter: (stock: FilterStock) => void;
  viewMode: ViewMode;
  onToggleViewMode: (mode: ViewMode) => void;
  onOpenCreateModal: () => void;
  onOpenSaleModal: () => void;
  criticalCount: number;
  isAdmin?: boolean;
}

export const ProductToolbar: React.FC<ProductToolbarProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  selectedStockFilter,
  onSelectStockFilter,
  viewMode,
  onToggleViewMode,
  onOpenCreateModal,
  onOpenSaleModal,
  criticalCount,
  isAdmin = true,
}) => {
  const categories: { key: FilterCategory; label: string }[] = [
    { key: 'TODAS', label: 'Todas las zonas' },
    { key: 'ROSTRO', label: 'Rostro' },
    { key: 'CEJAS', label: 'Cejas' },
    { key: 'LABIOS', label: 'Labios' },
    { key: 'OJOS', label: 'Ojos' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        marginBottom: '1.25rem',
      }}
    >
      {/* Top row: Search + View Mode + Main Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.85rem',
        }}
      >
        {/* Search Input */}
        <div
          style={{
            position: 'relative',
            flex: '1 1 280px',
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
            placeholder="Buscar por nombre, marca o N° de referencia..."
            style={{
              paddingLeft: '2.35rem',
              paddingRight: searchQuery ? '2.2rem' : '0.85rem',
              height: '2.5rem',
              backgroundColor: '#FFFFFF',
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

        {/* View switcher + Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {/* View toggle (Table vs Grid) */}
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.2rem',
            }}
          >
            <button
              type="button"
              onClick={() => onToggleViewMode('table')}
              title="Vista de tabla"
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: viewMode === 'table' ? 'var(--color-cashmere)' : 'transparent',
                color: viewMode === 'table' ? 'var(--color-plum)' : 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              <Table size={15} />
              <span className="hidden sm:inline">Tabla</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleViewMode('grid')}
              title="Vista de fichas"
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: viewMode === 'grid' ? 'var(--color-cashmere)' : 'transparent',
                color: viewMode === 'grid' ? 'var(--color-plum)' : 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              <LayoutGrid size={15} />
              <span className="hidden sm:inline">Fichas</span>
            </button>
          </div>

          {/* Quick Sale button (available to both ADMIN and VENDEDOR) */}
          <button
            type="button"
            className="btn-secondary"
            onClick={onOpenSaleModal}
            title="Registrar una venta o emitir factura"
          >
            <ShoppingBag size={15} color="var(--color-rosewood)" />
            <span>Facturar venta</span>
          </button>

          {/* New Product button (ADMIN only) */}
          {isAdmin && (
            <button
              type="button"
              className="btn-primary"
              onClick={onOpenCreateModal}
              title="Registrar nueva referencia cosmética"
            >
              <Plus size={16} />
              <span>Registrar producto</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom row: Filter Chips */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          borderTop: '1px solid var(--color-border-subtle)',
          paddingTop: '0.85rem',
        }}
      >
        {/* Category chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--color-text-muted)', marginRight: '0.2rem' }}>
            Zona:
          </span>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => onSelectCategory(cat.key)}
                style={{
                  fontSize: '0.8rem',
                  fontWeight: isSelected ? 600 : 500,
                  padding: '0.3rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid',
                  backgroundColor: isSelected ? 'var(--color-rosewood)' : '#FFFFFF',
                  borderColor: isSelected ? 'var(--color-rosewood)' : 'var(--color-border)',
                  color: isSelected ? '#FFFFFF' : 'var(--color-text-main)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Stock level filter: AGOTADOS vs DISPONIBLES */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
            Estado:
          </span>
          <select
            value={selectedStockFilter}
            onChange={(e) => onSelectStockFilter(e.target.value as FilterStock)}
            className="form-select"
            style={{
              padding: '0.25rem 0.65rem',
              fontSize: '0.8rem',
              width: 'auto',
              backgroundColor: '#FFFFFF',
            }}
          >
            <option value="TODOS">Todos los estados</option>
            <option value="AGOTADOS">
              Agotados (0 uds.{criticalCount > 0 ? ` · ${criticalCount}` : ''})
            </option>
            <option value="DISPONIBLES">Disponibles (&gt;0 uds.)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
