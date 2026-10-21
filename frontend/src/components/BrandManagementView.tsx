import React, { useState } from 'react';
import { Tag, Plus, Edit2, Check, Ban, AlertCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import type { Marca, MarcaInput } from '../types';

interface BrandManagementViewProps {
  brands: Marca[];
  onCreateBrand: (input: MarcaInput) => Promise<void>;
  onUpdateBrand: (id: number, input: Partial<MarcaInput>) => Promise<void>;
  onRefreshBrands: () => Promise<void>;
  isAdmin?: boolean;
}

export const BrandManagementView: React.FC<BrandManagementViewProps> = ({
  brands,
  onCreateBrand,
  onUpdateBrand,
  onRefreshBrands,
  isAdmin = true,
}) => {
  const [newBrandName, setNewBrandName] = useState('');
  const [editingBrandId, setEditingBrandId] = useState<number | null>(null);
  const [editingBrandName, setEditingBrandName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanName = newBrandName.trim();
    if (!cleanName) {
      setError('Por favor escribe el nombre de la marca cosmética.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onCreateBrand({ nombre: cleanName });
      setNewBrandName('');
      await onRefreshBrands();
    } catch (err: any) {
      setError(err.message || 'Error al registrar la marca cosmética.');
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
    const cleanName = editingBrandName.trim();
    if (!cleanName) {
      setError('El nombre de la marca no puede quedar vacío.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onUpdateBrand(id, { nombre: cleanName });
      setEditingBrandId(null);
      await onRefreshBrands();
    } catch (err: any) {
      setError(err.message || 'Error al renombrar la marca cosmética.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (brand: Marca) => {
    setError(null);
    if (!window.confirm(`¿Estás segura de desactivar la marca "${brand.nombre}" del catálogo activo?`)) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onUpdateBrand(brand.id, { activa: false });
      await onRefreshBrands();
    } catch (err: any) {
      setError(err.message || 'Error al desactivar la marca.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualRefresh = async () => {
    try {
      setIsRefreshing(true);
      await onRefreshBrands();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Editorial Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          padding: '1.25rem 1.5rem',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-rosewood)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(148, 73, 96, 0.25)',
            }}
          >
            <Tag size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--color-rosewood-deep)',
                }}
              >
                Marcas Cosméticas
              </h2>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '0.15rem 0.55rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--color-rose-subtle)',
                  color: 'var(--color-rosewood)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <ShieldCheck size={11} />
                <span>Gestión Exclusiva Admin</span>
              </span>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
              Catálogo de marcas activas utilizadas para clasificar las referencias del Atelier.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              backgroundColor: 'var(--color-rose-subtle)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.4rem 0.85rem',
              fontSize: '0.825rem',
              color: 'var(--color-text-muted)',
            }}
          >
            Marcas activas: <strong style={{ color: 'var(--color-rosewood-deep)' }}>{brands.length}</strong>
          </div>
          <button
            type="button"
            className="btn-ghost"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            title="Actualizar catálogo de marcas"
            style={{ padding: '0.45rem', borderRadius: 'var(--radius-md)' }}
          >
            <RefreshCw
              size={16}
              style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }}
            />
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: 'var(--color-crimson-light)',
            border: '1px solid var(--color-crimson-border)',
            color: 'var(--color-crimson)',
            fontSize: '0.85rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
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

      {/* Main Grid: Create Brand + List */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >
        {/* Create Card (Admin Only) */}
        {isAdmin && (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.05rem',
                fontWeight: 600,
                color: 'var(--color-rosewood-deep)',
                marginBottom: '0.35rem',
              }}
            >
              Registrar Nueva Marca
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
              Las marcas registradas quedarán disponibles inmediatamente al crear o actualizar referencias cosméticas.
            </p>

            <form onSubmit={handleCreateBrand}>
              <div className="form-group">
                <label className="form-label" htmlFor="brand-view-name">
                  Nombre de la marca cosmética
                </label>
                <input
                  id="brand-view-name"
                  type="text"
                  className="form-input"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="Ej: Trendy, Purpure, Milagros, Magna..."
                  disabled={isSubmitting}
                />
                <span className="form-hint">
                  Conectado a POST /marcas en el backend oficial.
                </span>
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting || !newBrandName.trim()}
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                <Plus size={16} />
                <span>{isSubmitting ? 'Guardando marca...' : 'Registrar marca en catálogo'}</span>
              </button>
            </form>
          </div>
        )}

        {/* Brands List Table */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--color-border-subtle)',
              paddingBottom: '0.75rem',
            }}
          >
            <div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  color: 'var(--color-rosewood-deep)',
                }}
              >
                Catálogo Activo de Marcas
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                Referencias asociadas a productos cosméticos
              </span>
            </div>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--color-rosewood)',
                backgroundColor: 'var(--color-rose-soft)',
                padding: '0.15rem 0.6rem',
                borderRadius: 'var(--radius-full)',
              }}
            >
              {brands.length} marcas
            </span>
          </div>

          {brands.length === 0 ? (
            <div
              style={{
                padding: '2.5rem 1rem',
                textAlign: 'center',
                color: 'var(--color-text-muted)',
                fontSize: '0.875rem',
                backgroundColor: 'var(--color-rose-subtle)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              No hay marcas activas registradas en este momento.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {brands.map((brand) => {
                const isEditing = editingBrandId === brand.id;

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
                      backgroundColor: 'var(--color-surface)',
                      gap: '0.75rem',
                      transition: 'background-color var(--transition-fast)',
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
                        />
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => handleSaveRename(brand.id)}
                          disabled={isSubmitting || !editingBrandName.trim()}
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                          title="Guardar nuevo nombre"
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
                          <Ban size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: 'var(--color-text-subtle)',
                              minWidth: '2.2rem',
                            }}
                          >
                            #{brand.id}
                          </span>
                          <div>
                            <span style={{ fontWeight: 600, color: 'var(--color-rosewood-deep)' }}>
                              {brand.nombre}
                            </span>
                            <span
                              style={{
                                display: 'inline-block',
                                marginLeft: '0.5rem',
                                fontSize: '0.68rem',
                                fontWeight: 600,
                                color: 'var(--color-sage)',
                                backgroundColor: 'var(--color-sage-light)',
                                padding: '0.05rem 0.45rem',
                                borderRadius: 'var(--radius-full)',
                              }}
                            >
                              Activa
                            </span>
                          </div>
                        </div>

                        {isAdmin && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <button
                              type="button"
                              className="btn-ghost"
                              onClick={() => handleStartRename(brand)}
                              title="Renombrar marca"
                              style={{ padding: '0.35rem 0.55rem', fontSize: '0.78rem' }}
                            >
                              <Edit2 size={13} />
                              <span className="hidden sm:inline">Renombrar</span>
                            </button>
                            <button
                              type="button"
                              className="btn-ghost"
                              onClick={() => handleDeactivate(brand)}
                              title="Desactivar marca del catálogo activo"
                              style={{
                                padding: '0.35rem 0.55rem',
                                fontSize: '0.78rem',
                                color: 'var(--color-crimson)',
                              }}
                            >
                              <Ban size={13} />
                              <span className="hidden sm:inline">Desactivar</span>
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
