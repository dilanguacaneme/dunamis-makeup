import React from 'react';
import { TrendingUp, Sparkles } from 'lucide-react';

interface AtelierStatusBarProps {
  totalInventory: number;
  totalSKUs: number;
}

export const AtelierStatusBar: React.FC<AtelierStatusBarProps> = ({
  totalInventory,
  totalSKUs,
}) => {
  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <section
      aria-label="Valoración total del inventario"
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-card)',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div
          style={{
            width: '2.75rem',
            height: '2.75rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-rose-subtle)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-rosewood)',
            flexShrink: 0,
          }}
        >
          <TrendingUp size={22} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--color-text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
              Valoración total del inventario
            </span>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 600,
                color: 'var(--color-rosewood)',
                backgroundColor: 'var(--color-rose-soft)',
                padding: '0.1rem 0.45rem',
                borderRadius: 'var(--radius-full)',
              }}
            >
              COP
            </span>
          </div>
          <div
            className="tabular-numbers"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.85rem',
              fontWeight: 700,
              color: 'var(--color-rosewood-deep)',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
            }}
          >
            {formatCOP(totalInventory)}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: 'var(--color-canvas)',
          border: '1px solid var(--color-border-subtle)',
          padding: '0.45rem 0.85rem',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.8rem',
          color: 'var(--color-text-muted)',
        }}
      >
        <Sparkles size={14} color="var(--color-rosewood)" />
        <span>
          Cálculo sobre <strong style={{ color: 'var(--color-rosewood-deep)' }}>{totalSKUs}</strong> referencias cosméticas registradas
        </span>
      </div>
    </section>
  );
};
