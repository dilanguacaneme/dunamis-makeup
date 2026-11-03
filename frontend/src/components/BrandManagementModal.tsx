import React, { useState } from 'react';
import { X, Tag, Plus, Edit2, Check, Ban, AlertCircle } from 'lucide-react';
import type { Marca, MarcaInput } from '../types';

interface BrandManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  brands: Marca[];
  onCreateBrand: (input: MarcaInput) => Promise<void>;
  onUpdateBrand: (id: number, input: Partial<MarcaInput>) => Promise<void>;
  onRefreshBrands: (incluirInactivas?: boolean) => Promise<void>;
}

export const BrandManagementModal: React.FC<BrandManagementModalProps> = ({
  isOpen,
  onClose,
  brands,
  onCreateBrand,
  onUpdateBrand,
  onRefreshBrands,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <BrandManagementModalContent
        brands={brands}
        onClose={onClose}
        onCreateBrand={onCreateBrand}
        onUpdateBrand={onUpdateBrand}
        onRefreshBrands={onRefreshBrands}
      />
    </div>
  );
};

interface BrandManagementModalContentProps {
  brands: Marca[];
  onClose: () => void;
  onCreateBrand: (input: MarcaInput) => Promise<void>;
  onUpdateBrand: (id: number, input: Partial<MarcaInput>) => Promise<void>;
  onRefreshBrands: (incluirInactivas?: boolean) => Promise<void>;
}

const BrandManagementModalContent: React.FC<BrandManagementModalContentProps> = ({
  brands,
  onClose,
  onCreateBrand,
  onUpdateBrand,
  onRefreshBrands,
}) => {
  const [newBrandName, setNewBrandName] = useState('');
  const [editingBrandId, setEditingBrandId] = useState<number | null>(null);
  const [editingBrandName, setEditingBrandName] = useState('');
  const [filterMode, setFilterMode] = useState<'activas' | 'todas'>('activas');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFilterChange = async (mode: 'activas' | 'todas') => {
    setFilterMode(mode);
    try {
      await onRefreshBrands(mode === 'todas');
    } catch (err: any) {
      setError(err.message || 'Error al filtrar marcas.');
    }
  };

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanName = newBrandName.trim().replace(/\s+/g, ' ');
    if (!cleanName || cleanName.length < 2) {
      setError('Por favor escribe un nombre de marca válido (mínimo 2 caracteres).');
      return;
    }

    try {
      setIsSubmitting(true);
      await onCreateBrand({ nombre: cleanName });
      setNewBrandName('');
      await onRefreshBrands(filterMode === 'todas');
    } catch (err: any) {
      setError(err.message || 'Error al crear la marca.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartRename = (brand: Marca) => {
    setEditingBrandId(brand.id);
    setEditingBrandName(brand.nombre);
    setError(null);
  };

  const handleSaveRename = async (id: number) => {
    setError(null);
    const cleanName = editingBrandName.trim().replace(/\s+/g, ' ');
    if (!cleanName || cleanName.length < 2) {
      setError('El nombre de la marca debe tener al menos 2 caracteres.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onUpdateBrand(id, { nombre: cleanName });
      setEditingBrandId(null);
      await onRefreshBrands(filterMode === 'todas');
    } catch (err: any) {
      setError(err.message || 'Error al renombrar la marca.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (brand: Marca) => {
    setError(null);
    if (!window.confirm(`¿Estás segura de desactivar la marca "${brand.nombre}"?`)) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onUpdateBrand(brand.id, { activa: false });
      await onRefreshBrands(filterMode === 'todas');
    } catch (err: any) {
      setError(err.message || 'Error al desactivar la marca.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReactivate = async (brand: Marca) => {
    setError(null);
    try {
      setIsSubmitting(true);
      await onUpdateBrand(brand.id, { activa: true });
      await onRefreshBrands(filterMode === 'todas');
    } catch (err: any) {
      setError(err.message || 'Error al reactivar la marca.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-content"
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="brand-management-title"
      style={{ maxWidth: '580px' }}
    >
      {/* Header */}
      <div
        style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--color-rose-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: '2.1rem',
              height: '2.1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-rosewood)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Tag size={16} />
          </div>
          <div>
            <h2
              id="brand-management-title"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.15rem',
                fontWeight: 700,
                color: 'var(--color-rosewood-deep)',
              }}
            >
              Gestión de Marcas
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Superficie exclusiva para administradoras (POST /marcas · PATCH /marcas/&#123;id&#125;)
            </span>
          </div>
        </div>
        <button type="button" className="btn-ghost" onClick={onClose} style={{ padding: '0.4rem' }}>
          <X size={18} />
        </button>
      </div>

      <div style={{ padding: '1.5rem' }}>
        {error && (
          <div
            style={{
              backgroundColor: 'var(--color-crimson-light)',
              border: '1px solid var(--color-crimson-border)',
              color: 'var(--color-crimson)',
              fontSize: '0.85rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
            role="alert"
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <div>{error}</div>
          </div>
        )}

        {/* Create Brand Form */}
        <form onSubmit={handleCreateBrand} style={{ marginBottom: '1.5rem' }}>
          <label className="form-label" htmlFor="brand-name-input">
            Registrar nueva marca
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              id="brand-name-input"
              type="text"
              className="form-input"
              placeholder="Ej: Rare Beauty, NARS, MAC..."
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              disabled={isSubmitting}
              maxLength={80}
              required
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || !newBrandName.trim()}
              style={{ flexShrink: 0 }}
            >
              <Plus size={16} />
              <span>{isSubmitting ? 'Guardando...' : 'Crear'}</span>
            </button>
          </div>
        </form>

        {/* Brand List Section with Filter Toggle */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.75rem',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.95rem',
                fontWeight: 600,
                color: 'var(--color-rosewood-deep)',
              }}
            >
              Marcas registradas ({brands.length})
            </h3>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                padding: '0.15rem',
              }}
            >
              <button
                type="button"
                onClick={() => handleFilterChange('activas')}
                style={{
                  padding: '0.25rem 0.55rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: filterMode === 'activas' ? 'var(--color-rosewood)' : 'transparent',
                  color: filterMode === 'activas' ? '#FFFFFF' : 'var(--color-text-muted)',
                }}
              >
                Activas
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange('todas')}
                style={{
                  padding: '0.25rem 0.55rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: filterMode === 'todas' ? 'var(--color-rosewood)' : 'transparent',
                  color: filterMode === 'todas' ? '#FFFFFF' : 'var(--color-text-muted)',
                }}
              >
                Todas
              </button>
            </div>
          </div>

          {brands.length === 0 ? (
            <div
              style={{
                padding: '1.5rem',
                textAlign: 'center',
                color: 'var(--color-text-muted)',
                fontSize: '0.85rem',
                backgroundColor: 'var(--color-rose-subtle)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              No hay marcas para mostrar en este filtro.
            </div>
          ) : (
            <div
              style={{
                maxHeight: '260px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              {brands.map((brand) => {
                const isEditing = editingBrandId === brand.id;
                const isActiva = brand.activa !== false;

                return (
                  <div
                    key={brand.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      backgroundColor: isActiva ? '#FFFFFF' : 'rgba(240, 235, 235, 0.4)',
                      opacity: isActiva ? 1 : 0.85,
                      gap: '0.75rem',
                    }}
                  >
                    {isEditing ? (
                      <div style={{ display: 'flex', flex: 1, gap: '0.5rem', alignItems: 'center' }}>
                        <input
                          type="text"
                          className="form-input"
                          value={editingBrandName}
                          onChange={(e) => setEditingBrandName(e.target.value)}
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
                          autoFocus
                          disabled={isSubmitting}
                          maxLength={80}
                        />
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => handleSaveRename(brand.id)}
                          disabled={isSubmitting || !editingBrandName.trim()}
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                          title="Guardar nombre"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => setEditingBrandId(null)}
                          style={{ padding: '0.35rem', fontSize: '0.8rem' }}
                          title="Cancelar edición"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: 'var(--color-text-subtle)',
                              minWidth: '2rem',
                            }}
                          >
                            #{brand.id}
                          </span>
                          <span
                            style={{
                              fontWeight: 600,
                              color: isActiva ? 'var(--color-plum)' : 'var(--color-text-muted)',
                              textDecoration: isActiva ? 'none' : 'line-through',
                            }}
                          >
                            {brand.nombre}
                          </span>
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              color: isActiva ? 'var(--color-sage)' : 'var(--color-crimson)',
                              backgroundColor: isActiva ? 'var(--color-sage-light)' : 'var(--color-crimson-light)',
                              padding: '0.05rem 0.4rem',
                              borderRadius: 'var(--radius-full)',
                            }}
                          >
                            {isActiva ? 'Activa' : 'Inactiva'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <button
                            type="button"
                            className="btn-ghost"
                            onClick={() => handleStartRename(brand)}
                            title="Renombrar marca"
                            style={{ padding: '0.35rem 0.55rem', fontSize: '0.78rem' }}
                          >
                            <Edit2 size={13} />
                            <span>Renombrar</span>
                          </button>
                          {isActiva ? (
                            <button
                              type="button"
                              className="btn-ghost"
                              onClick={() => handleDeactivate(brand)}
                              title="Desactivar marca del catálogo"
                              style={{
                                padding: '0.35rem 0.55rem',
                                fontSize: '0.78rem',
                                color: 'var(--color-crimson)',
                              }}
                            >
                              <Ban size={13} />
                              <span>Desactivar</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn-ghost"
                              onClick={() => handleReactivate(brand)}
                              title="Reactivar marca para el catálogo"
                              style={{
                                padding: '0.35rem 0.55rem',
                                fontSize: '0.78rem',
                                color: 'var(--color-sage)',
                              }}
                            >
                              <Check size={13} />
                              <span>Reactivar</span>
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
