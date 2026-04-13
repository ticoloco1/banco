'use client';

import { useEffect, useRef, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Html5Qrcode } from 'html5-qrcode';
import { useSearchParams } from 'next/navigation';

export default function ValidarAtivoPage() {
  const params = useSearchParams();
  const [token, setToken] = useState('');
  const [result, setResult] = useState<{ valid?: boolean; message?: string; discountPercent?: number } | null>(null);
  const [scanning, setScanning] = useState(false);
  const readerId = 'tb-store-reader';
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const validateToken = async (rawToken: string) => {
    if (!rawToken) return;
    const clean = rawToken.includes('token=') ? new URL(rawToken).searchParams.get('token') || '' : rawToken;
    setToken(clean);
    const res = await fetch('/api/nft/vault/validate-qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: clean, merchantId: 'store-web' }),
    });
    const data = await res.json().catch(() => ({}));
    setResult(data);
  };

  const startScanner = async () => {
    if (scanning) return;
    const scanner = new Html5Qrcode(readerId);
    scannerRef.current = scanner;
    setScanning(true);
    await scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      async (decodedText) => {
        await scanner.stop();
        setScanning(false);
        await validateToken(decodedText);
      },
      () => undefined,
    );
  };

  const stopScanner = async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    try {
      await scanner.stop();
    } catch {
      // ignore
    }
    setScanning(false);
  };

  useEffect(() => () => void stopScanner(), []);

  useEffect(() => {
    const t = params.get('token') || '';
    if (t) void validateToken(t);
  }, [params]);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-4">
        <h1 className="text-3xl font-black text-[var(--text)]">Modo Lojista - Validar Ativo</h1>
        <p className="text-sm text-[var(--text2)]">
          Escaneie o QR do cliente. Sem app: funciona direto no navegador.
        </p>
        <div className="card p-4 space-y-3">
          <div id={readerId} className="w-full overflow-hidden rounded-xl" />
          <div className="flex gap-2 flex-wrap">
            <button className="btn-primary text-sm" onClick={() => void startScanner()}>
              Iniciar câmera
            </button>
            <button className="btn-secondary text-sm" onClick={() => void stopScanner()}>
              Parar câmera
            </button>
          </div>
          <div className="flex gap-2">
            <input
              className="input flex-1 font-mono"
              placeholder="Cole token QR"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <button className="btn-secondary text-sm" onClick={() => void validateToken(token)}>
              Validar
            </button>
          </div>
        </div>
        {result ? (
          <div className={`card p-4 ${result.valid ? 'border-green-500/40 bg-green-500/10' : 'border-red-500/40 bg-red-500/10'}`}>
            <p className={`font-black ${result.valid ? 'text-green-400' : 'text-red-400'}`}>
              {result.message || (result.valid ? 'Válido' : 'Inválido')}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
