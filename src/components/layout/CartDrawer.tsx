'use client';
import { useCart } from '@/store/cart';
import { X, Trash2, ShoppingCart, CreditCard, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function CartDrawer() {
  const { items, isOpen, close, remove, clear, total } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const handleCheckout = async () => {
    if (!user) {
      close();
      router.push('/auth?redirect=/planos');
      return;
    }
    if (items.length === 0) { toast.error('Carrinho vazio'); return; }

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, userId: user.id, userEmail: user.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'checkout error');
      if (data.url) {
        clear();
        window.location.href = data.url;
      } else {
        toast.error('Erro ao iniciar pagamento');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro no checkout');
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={close}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 198, backdropFilter: 'blur(2px)' }}
        />
      )}

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, height: '100%',
        width: 'min(420px,100vw)',
        background: 'var(--bg2)',
        borderLeft: '1px solid var(--border)',
        zIndex: 199,
        display: 'flex', flexDirection: 'column',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: '-12px 0 40px rgba(0,0,0,0.4)',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingCart size={18} color="var(--text)" />
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Carrinho</span>
            {items.length > 0 && (
              <span style={{ background: 'var(--accent)', color: '#fff', fontSize: 11, fontWeight: 800, padding: '2px 7px', borderRadius: 20 }}>{items.length}</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {items.length > 0 && (
              <button onClick={clear} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 12, fontWeight: 600, padding: '4px 8px', borderRadius: 6 }}>
                Limpar
              </button>
            )}
            <button onClick={close} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text)' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text2)' }}>
              <ShoppingCart size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p style={{ fontSize: 15, fontWeight: 600 }}>Carrinho vazio</p>
              <p style={{ fontSize: 13, marginTop: 6 }}>Adicione planos, slugs ou vídeos</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {items.map(item => (
                <div key={item.id} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</p>
                    <p style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 700 }}>USD ${item.price.toFixed(2)}</p>
                  </div>
                  <button onClick={() => remove(item.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4, borderRadius: 6, flexShrink: 0 }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 14, color: 'var(--text2)' }}>Total</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>USD ${total().toFixed(2)}</span>
            </div>
            <button
              onClick={() => void handleCheckout()}
              style={{ width: '100%', padding: '13px', background: 'var(--gold)', color: '#000', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <CreditCard size={18} /> Pagar com Stripe
            </button>
            <p style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <Lock size={10} /> Pagamento seguro · SSL · Stripe
            </p>
          </div>
        )}
      </div>
    </>
  );
}
