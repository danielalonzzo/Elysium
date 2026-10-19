/** Adaptación local del contrato estacional usado por la mascota de Pura Vida Pets. */
export const SEASONAL_THEMES = Object.freeze({ NONE: "none", MES_PATRIO: "mes-patrio", HALLOWEEN: "halloween", NAVIDAD: "navidad", VERANO: "verano" });
export const DEFAULT_SEASONAL_CONFIG = Object.freeze({ enabled: true, activeTheme: SEASONAL_THEMES.MES_PATRIO, forceAlwaysActive: false, dateRange: { startMonth: 9, startDay: 1, endMonth: 9, endDay: 30 }, features: { logoChonete: true } });
const ranges = { [SEASONAL_THEMES.MES_PATRIO]: [901, 930], [SEASONAL_THEMES.HALLOWEEN]: [1001, 1031], [SEASONAL_THEMES.NAVIDAD]: [1201, 1231] };
export function isSeasonActive(config, now = new Date()) {
  if (!config?.enabled) return false;
  if (config.forceAlwaysActive) return true;
  const monthDay = (now.getUTCMonth() + 1) * 100 + now.getUTCDate();
  const configured = config.dateRange;
  const [start, end] = configured ? [configured.startMonth * 100 + configured.startDay, configured.endMonth * 100 + configured.endDay] : ranges[config.activeTheme] || [0, -1];
  return start <= end ? monthDay >= start && monthDay <= end : monthDay >= start || monthDay <= end;
}
