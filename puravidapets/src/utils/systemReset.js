/**
 * Hard Reset Pipeline for Pura Vida Pets
 * Clears storages, cookies, IndexedDB, and unregisters Service Workers.
 */

export const elysiusForceUpdate = async () => {
  console.log("Iniciando Hard Reset...");

  // 1. Fallback Timer (1.8s) in case async operations hang
  const fallbackTimer = setTimeout(() => {
    console.warn("Fallback timer triggered. Forzando recarga.");
    forceReload();
  }, 1800);

  try {
    // 2. Cookie Purge (Epoch Zero)
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      // Expire on root and current domain
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
    }
    console.log("Cookies purgadas.");

    // 3. Local/Session Storage Wipe
    localStorage.clear();
    sessionStorage.clear();
    console.log("Storage limpiado.");

    // 4. IndexedDB Wipe (Procedurally delete databases like Firebase)
    if (window.indexedDB && window.indexedDB.databases) {
      try {
        const dbs = await window.indexedDB.databases();
        dbs.forEach(db => {
          if (db.name) {
            window.indexedDB.deleteDatabase(db.name);
          }
        });
        console.log("IndexedDB limpiado.");
      } catch (e) {
        console.warn("No se pudo limpiar IndexedDB procedimentalmente", e);
      }
    } else {
      // Fallback for browsers that don't support indexedDB.databases()
      const dbsToDelete = [
        "firebaseLocalStorageDb",
        "firebase-heartbeat-database",
        "firebase-installations-database"
      ];
      dbsToDelete.forEach(dbName => window.indexedDB.deleteDatabase(dbName));
    }

    // 5. Service Workers Unregister & Cache Storage Clear
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (let registration of registrations) {
        await registration.unregister();
      }
      console.log("Service Workers eliminados.");
    }

    // 6. Redirect with Cache Buster
    clearTimeout(fallbackTimer);
    forceReload();

  } catch (error) {
    console.error("Error durante el Hard Reset:", error);
    // Even if it fails, fallback to reload
    clearTimeout(fallbackTimer);
    forceReload();
  }
};

const forceReload = () => {
  window.location.href = window.location.pathname + '?_t=' + Date.now();
};
