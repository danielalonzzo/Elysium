// Coordina el dock de contacto flotante con las animaciones cinemáticas de
// Inicio (la portada y la baraja de "Productos destacados"). Cada animación se
// marca como "activa" mientras se reproduce; en móvil el dock permanece oculto
// mientras haya alguna activa y reaparece justo al terminar cada una — de modo
// que no estorba sobre la portada ni sobre el despliegue de las tarjetas.
const activeAnimations = new Set<string>();
const listeners = new Set<() => void>();

export function setDockAnimationActive(id: string, active: boolean) {
  const had = activeAnimations.has(id);
  if (active === had) return;
  if (active) activeAnimations.add(id);
  else activeAnimations.delete(id);
  listeners.forEach((listener) => listener());
}

export function isAnyDockAnimationActive() {
  return activeAnimations.size > 0;
}

export function subscribeDockAnimations(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
