import React, { useState } from 'react';
import { Layers, Plus, Edit2, Check, Ban, AlertCircle, RefreshCw, ShieldCheck, X } from 'lucide-react';
import type { Categoria, CategoriaInput } from '../types';

interface CategoryManagementViewProps {
  categories: Categoria[];
  onCreateCategory: (input: CategoriaInput) => Promise<void>;
  onUpdateCategory: (id: number, input: Partial<CategoriaInput>) => Promise<void>;
  onRefreshCategories: (incluirInactivas?: boolean) => Promise<void>;
  isAdmin?: boolean;
}

export const CategoryManagementView: React.FC<CategoryManagementViewProps> = ({
  categories,
  onCreateCategory,
  onUpdateCategory,
  onRefreshCategories,
  isAdmin = true,
}) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [filterMode, setFilterMode] = useState<'activas' | 'todas'>('activas');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleFilterChange = async (mode: 'activas' | 'todas') => {
    setFilterMode(mode);
    try {
      setIsRefreshing(true);
      await onRefreshCategories(mode === 'todas');
    } catch (err: any) {
      setError(err.message || 'Error al filtrar categorías.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanName = newCategoryName.trim().replace(/\s+/g, ' ');
    if (!cleanName || cleanName.length < 2) {
      setError('Por favor escribe un nombre de categoría válido (mínimo 2 caracteres).');
      return;
    }

    try {
      setIsSubmitting(true);
      await onCreateCategory({ nombre: cleanName });
      setNewCategoryName('');
      await onRefreshCategories(filterMode === 'todas');
    } catch (err: any) {
      setError(err.message || 'Error al registrar la categoría cosmética.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartRename = (category: Categoria) => {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.nombre);
    setError(null);
  };

  const handleSaveRename = async (id: number) => {
    setError(null);
    const cleanName = editingCategoryName.trim().replace(/\s+/g, ' ');
    if (!cleanName || cleanName.length < 2) {
      setError('El nombre de la categoría debe tener al menos 2 caracteres.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onUpdateCategory(id, { nombre: cleanName });
      setEditingCategoryId(null);
      await onRefreshCategories(filterMode === 'todas');
    } catch (err: any) {
      setError(err.message || 'Error al renombrar la categoría.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (category: Categoria) => {
    setError(null);
    if (!window.confirm(`¿Estás segura de desactivar la categoría "${category.nombre}" del catálogo activo? Los productos existentes mantendrán su historial pero no podrá seleccionarse para nuevos registros.`)) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onUpdateCategory(category.id, { activa: false });
      await onRefreshCategories(filterMode === 'todas');
    } catch (err: any) {
      setError(err.message || 'Error al desactivar la categoría.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReactivate = async (category: Categoria) => {
    setError(null);
    try {
      setIsSubmitting(true);
      await onUpdateCategory(category.id, { activa: true });
      await onRefreshCategories(filterMode === 'todas');
    } catch (err: any) {
      setError(err.message || 'Error al reactivar la categoría.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualRefresh = async () => {
    try {
      setIsRefreshing(true);
      await onRefreshCategories(filterMode === 'todas');
    } catch (err: any) {
      setError(err.message || 'Error al recargar categorías.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const activeCategoriesCount = categories.filter((c) => c.activa !== false).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Top Banner / Hero */}
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
            <Layers size={20} />
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
                Categorías Cosméticas
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
              Zonas y categorías activas para el catálogo de Dunamis Makeup.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          {isAdmin && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                padding: '0.2rem',
              }}
            >
              <button
                type="button"
                onClick={() => handleFilterChange('activas')}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: filterMode === 'activas' ? 'var(--color-rosewood)' : 'transparent',
                  color: filterMode === 'activas' ? '#FFFFFF' : 'var(--color-text-muted)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                Solo Activas
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange('todas')}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: filterMode === 'todas' ? 'var(--color-rosewood)' : 'transparent',
                  color: filterMode === 'todas' ? '#FFFFFF' : 'var(--color-text-muted)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                Todas las Categorías
              </button>
            </div>
          )}

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
            Activas: <strong style={{ color: 'var(--color-rosewood-deep)' }}>{activeCategoriesCount}</strong>
            {filterMode === 'todas' && (
              <> | Total: <strong style={{ color: 'var(--color-rosewood-deep)' }}>{categories.length}</strong></>
            )}
          </div>
          <button
            type="button"
            className="btn-ghost"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            title="Actualizar catálogo de categorías"
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

      {/* Main Grid: Create Category + List */}
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
              Registrar Nueva Categoría
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
              Las categorías registradas quedarán disponibles inmediatamente para filtros e inventario.
            </p>

            <form onSubmit={handleCreateCategory}>
              <div className="form-group">
                <label className="form-label" htmlFor="cat-view-name">
                  Nombre de la categoría cosmética
                </label>
                <input
                  id="cat-view-name"
                  type="text"
                  className="form-input"
                  placeholder="Ej: Brochas, Skincare, Uñas..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  disabled={isSubmitting}
                  maxLength={60}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting || !newCategoryName.trim()}
                style={{ width: '100%', marginTop: '0.75rem' }}
              >
                <Plus size={16} />
                <span>{isSubmitting ? 'Registrando...' : 'Agregar al Catálogo'}</span>
              </button>
            </form>
          </div>
        )}

        {/* Category List Card */}
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
                {filterMode === 'todas' ? 'Todas las Categorías (Activas e Inactivas)' : 'Catálogo Activo de Categorías'}
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                Zonas y clasificaciones oficiales
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
              {categories.length} {categories.length === 1 ? 'categoría' : 'categorías'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', maxHeight: '520px', overflowY: 'auto' }}>
            {categories.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                No hay categorías en este estado.
              </div>
            ) : (
              categories.map((cat) => {
                const isEditing = editingCategoryId === cat.id;
                const isInactive = cat.activa === false;

                return (
                  <div
                    key={cat.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border-subtle)',
                      backgroundColor: isInactive ? 'var(--color-surface-subtle)' : 'var(--color-surface)',
                      opacity: isInactive ? 0.75 : 1,
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <div style={{ flex: 1, marginRight: '0.75rem' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <input
                            type="text"
                            className="form-input"
                            value={editingCategoryName}
                            onChange={(e) => setEditingCategoryName(e.target.value)}
                            disabled={isSubmitting}
                            maxLength={60}
                            autoFocus
                            style={{ padding: '0.3rem 0.55rem', fontSize: '0.85rem' }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                void handleSaveRename(cat.id);
                              } else if (e.key === 'Escape') {
                                setEditingCategoryId(null);
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => handleSaveRename(cat.id)}
                            disabled={isSubmitting}
                            style={{ padding: '0.3rem 0.65rem' }}
                            title="Guardar nombre"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn-ghost"
                            onClick={() => setEditingCategoryId(null)}
                            disabled={isSubmitting}
                            style={{ padding: '0.3rem 0.45rem' }}
                            title="Cancelar"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <span
                            style={{
                              fontWeight: 600,
                              fontSize: '0.9rem',
                              color: isInactive ? 'var(--color-text-muted)' : 'var(--color-text-main)',
                              textDecoration: isInactive ? 'line-through' : 'none',
                            }}
                          >
                            {cat.nombre}
                          </span>
                          {isInactive && (
                            <span className="badge-status badge-inactive" style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
                              Inactiva
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {!isEditing && isAdmin && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => handleStartRename(cat)}
                          disabled={isSubmitting}
                          style={{ padding: '0.35rem 0.55rem', fontSize: '0.78rem' }}
                          title="Renombrar categoría"
                        >
                          <Edit2 size={13} />
                          <span style={{ marginLeft: '0.25rem' }}>Editar</span>
                        </button>

                        {isInactive ? (
                          <button
                            type="button"
                            className="btn-ghost"
                            onClick={() => handleReactivate(cat)}
                            disabled={isSubmitting}
                            style={{ padding: '0.35rem 0.55rem', fontSize: '0.78rem', color: 'var(--color-success)' }}
                            title="Reactivar categoría en catálogo"
                          >
                            <Check size={13} />
                            <span style={{ marginLeft: '0.25rem' }}>Reactivar</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn-ghost"
                            onClick={() => handleDeactivate(cat)}
                            disabled={isSubmitting}
                            style={{ padding: '0.35rem 0.55rem', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}
                            title="Desactivar categoría (borrado lógico)"
                          >
                            <Ban size={13} />
                            <span style={{ marginLeft: '0.25rem' }}>Desactivar</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
