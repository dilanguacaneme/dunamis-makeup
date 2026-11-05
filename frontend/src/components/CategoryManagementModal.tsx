import React, { useState } from 'react';
import { X, Layers, Plus, Edit2, Check, Ban, AlertCircle } from 'lucide-react';
import type { Categoria, CategoriaInput } from '../types';

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Categoria[];
  onCreateCategory: (input: CategoriaInput) => Promise<void>;
  onUpdateCategory: (id: number, input: Partial<CategoriaInput>) => Promise<void>;
  onRefreshCategories: (incluirInactivas?: boolean) => Promise<void>;
}

export const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({
  isOpen,
  onClose,
  categories,
  onCreateCategory,
  onUpdateCategory,
  onRefreshCategories,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <CategoryManagementModalContent
        categories={categories}
        onClose={onClose}
        onCreateCategory={onCreateCategory}
        onUpdateCategory={onUpdateCategory}
        onRefreshCategories={onRefreshCategories}
      />
    </div>
  );
};

interface CategoryManagementModalContentProps {
  categories: Categoria[];
  onClose: () => void;
  onCreateCategory: (input: CategoriaInput) => Promise<void>;
  onUpdateCategory: (id: number, input: Partial<CategoriaInput>) => Promise<void>;
  onRefreshCategories: (incluirInactivas?: boolean) => Promise<void>;
}

const CategoryManagementModalContent: React.FC<CategoryManagementModalContentProps> = ({
  categories,
  onClose,
  onCreateCategory,
  onUpdateCategory,
  onRefreshCategories,
}) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [filterMode, setFilterMode] = useState<'activas' | 'todas'>('activas');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFilterChange = async (mode: 'activas' | 'todas') => {
    setFilterMode(mode);
    try {
      await onRefreshCategories(mode === 'todas');
    } catch (err: any) {
      setError(err.message || 'Error al filtrar categorías.');
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
      setError(err.message || 'Error al crear la categoría.');
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
    if (!window.confirm(`¿Estás segura de desactivar la categoría "${category.nombre}"? Los productos existentes mantendrán su historial pero no podrá seleccionarse para nuevos registros.`)) {
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

  return (
    <div
      className="modal-content"
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-management-title"
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
            <Layers size={16} />
          </div>
          <div>
            <h2
              id="category-management-title"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.15rem',
                fontWeight: 700,
                color: 'var(--color-rosewood-deep)',
              }}
            >
              Gestión de Categorías
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Superficie para administración de zonas y categorías (POST /categorias · PATCH /categorias/&#123;id&#125;)
            </span>
          </div>
        </div>
        <button type="button" className="btn-ghost" onClick={onClose} style={{ padding: '0.4rem' }}>
          <X size={18} />
        </button>
      </div>

      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Error Alert */}
        {error && (
          <div className="alert alert-error" style={{ fontSize: '0.825rem' }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario de Creación Rápida */}
        <form onSubmit={handleCreateCategory} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Nueva categoría (ej: Brochas, Skincare, Uñas...)"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            disabled={isSubmitting}
            maxLength={60}
            style={{ flex: 1 }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || !newCategoryName.trim()}
            style={{ whiteSpace: 'nowrap' }}
          >
            <Plus size={16} />
            <span>Agregar</span>
          </button>
        </form>

        {/* Filtros de Estado */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--color-border-subtle)',
            paddingBottom: '0.75rem',
          }}
        >
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
            Categorías registradas ({categories.length})
          </span>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button
              type="button"
              className={`btn-ghost ${filterMode === 'activas' ? 'active' : ''}`}
              onClick={() => handleFilterChange('activas')}
              style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.55rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: filterMode === 'activas' ? 'var(--color-rose-soft)' : 'transparent',
                fontWeight: filterMode === 'activas' ? 700 : 500,
              }}
            >
              Solo Activas
            </button>
            <button
              type="button"
              className={`btn-ghost ${filterMode === 'todas' ? 'active' : ''}`}
              onClick={() => handleFilterChange('todas')}
              style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.55rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: filterMode === 'todas' ? 'var(--color-rose-soft)' : 'transparent',
                fontWeight: filterMode === 'todas' ? 700 : 500,
              }}
            >
              Todas (incluye inactivas)
            </button>
          </div>
        </div>

        {/* Lista de Categorías */}
        <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {categories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              No hay categorías para mostrar en este filtro.
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
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border-subtle)',
                    backgroundColor: isInactive ? 'var(--color-surface-subtle)' : 'var(--color-surface)',
                    opacity: isInactive ? 0.75 : 1,
                  }}
                >
                  {/* Nombre o Input de Edición */}
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
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
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
                          style={{ padding: '0.25rem 0.6rem' }}
                          title="Guardar nombre"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => setEditingCategoryId(null)}
                          disabled={isSubmitting}
                          style={{ padding: '0.25rem 0.4rem' }}
                          title="Cancelar"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            color: isInactive ? 'var(--color-text-muted)' : 'var(--color-text-main)',
                            textDecoration: isInactive ? 'line-through' : 'none',
                          }}
                        >
                          {cat.nombre}
                        </span>
                        {isInactive && (
                          <span className="badge-status badge-inactive" style={{ fontSize: '0.68rem', padding: '0.1rem 0.35rem' }}>
                            Inactiva
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  {!isEditing && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => handleStartRename(cat)}
                        disabled={isSubmitting}
                        style={{ padding: '0.3rem 0.45rem', fontSize: '0.75rem' }}
                        title="Renombrar categoría"
                      >
                        <Edit2 size={13} />
                        <span style={{ marginLeft: '0.2rem' }}>Editar</span>
                      </button>

                      {isInactive ? (
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => handleReactivate(cat)}
                          disabled={isSubmitting}
                          style={{ padding: '0.3rem 0.45rem', fontSize: '0.75rem', color: 'var(--color-success)' }}
                          title="Reactivar categoría en catálogo"
                        >
                          <Check size={13} />
                          <span style={{ marginLeft: '0.2rem' }}>Reactivar</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => handleDeactivate(cat)}
                          disabled={isSubmitting}
                          style={{ padding: '0.3rem 0.45rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}
                          title="Desactivar categoría (borrado lógico)"
                        >
                          <Ban size={13} />
                          <span style={{ marginLeft: '0.2rem' }}>Desactivar</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div
          style={{
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--color-border-subtle)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
