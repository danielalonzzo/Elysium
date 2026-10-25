'use client';
import {useEffect, useState} from 'react';

/**
 * El pedido de la tienda vive en el navegador: no hay cuentas ni pagos en línea.
 * Se envía a la clínica por WhatsApp, que confirma disponibilidad y total.
 *
 * La tienda y la cabecera (el contador junto a «Tienda») lo leen a la vez, así
 * que cada cambio avisa con un evento además de guardarse.
 */
export type Line = {id: string, size: string, qty: number};
const KEY = 'valladares-cart-v1', EVENT = 'valladares-cart';

export function readCart(): Line[] {
  try { const lines = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(lines) ? lines.filter(l => l && l.id && l.qty > 0) : []; }
  catch { return []; }
}
export function writeCart(lines: Line[]) {
  try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch { /* almacenamiento bloqueado: el pedido dura lo que la página */ }
  window.dispatchEvent(new CustomEvent(EVENT, {detail: lines}));
}
export function addLine(lines: Line[], id: string, size: string, qty = 1): Line[] {
  const found = lines.find(l => l.id === id && l.size === size);
  return found ? lines.map(l => l === found ? {...l, qty: Math.min(99, l.qty + qty)} : l) : [...lines, {id, size, qty}];
}
export function setQty(lines: Line[], line: Line, qty: number): Line[] {
  return qty <= 0 ? lines.filter(l => l !== line) : lines.map(l => l === line ? {...l, qty: Math.min(99, qty)} : l);
}

export function useCart(): [Line[], (lines: Line[]) => void] {
  const [lines, setLines] = useState<Line[]>([]);
  useEffect(() => {
    const sync = (e?: Event) => setLines((e as CustomEvent)?.detail || readCart());
    sync();
    const storage = (e: StorageEvent) => { if (e.key === KEY) setLines(readCart()); };
    window.addEventListener(EVENT, sync); window.addEventListener('storage', storage);
    return () => { window.removeEventListener(EVENT, sync); window.removeEventListener('storage', storage); };
  }, []);
  return [lines, writeCart];
}
