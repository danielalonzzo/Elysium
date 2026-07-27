"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { applyBrowserChrome, initBrowserChrome } from "../../lib/browserChrome";

/*
 * Mantiene `<meta name="theme-color">` al día para que las barras del navegador
 * (arriba y abajo en iOS) acompañen al tema y a la portada. No pinta nada.
 *
 * Se reaplica al cambiar de ruta porque la navegación de Next reescribe la
 * metadata del layout y devolvería la etiqueta a su valor de servidor.
 */
export function BrowserChrome() {
  const pathname = usePathname();

  useEffect(() => {
    initBrowserChrome();
    applyBrowserChrome();
  }, [pathname]);

  return null;
}
