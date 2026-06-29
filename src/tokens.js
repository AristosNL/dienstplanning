/**
 * tokens.js — AfdelingsPlan design system
 *
 * Eén bron van waarheid voor alle kleuren en design-tokens.
 * Importeer in componenten als: import C from "./tokens";
 *
 * Accent: SKB Winterswijk paars (#6c2a7d)
 */

const T = {
  /* ── Brand — SKB paars ─────────────────────────────────────── */
  brand:    "#6c2a7d",   // primair accent
  brandDk:  "#4d1d58",   // hover / actieve staat
  brandDkr: "#2d1333",   // sidebar achtergrond
  brandLt:  "#f5eef8",   // lichte tint achtergrond
  brandMid: "#9d4ead",   // zachte variant (badges, sub-accenten)
  brandBd:  "#d4a8de",   // paarse border

  /* ── Tekst ─────────────────────────────────────────────────── */
  ink:  "#1a1017",   // primaire tekst
  sub:  "#4b4254",   // secundaire tekst
  mute: "#9287a0",   // placeholder / labels

  /* ── Oppervlakken ──────────────────────────────────────────── */
  white:  "#ffffff",
  panel:  "#f7f4f8",   // pagina achtergrond
  panel2: "#ede8f0",   // geneste sectie

  /* ── Randen ────────────────────────────────────────────────── */
  line:  "#e8e0ed",   // standaard border
  line2: "#d4c9d9",   // iets zwaarder

  /* ── Semantisch / status ───────────────────────────────────── */
  ok:     "#16a34a",
  okBg:   "#dcfce7",
  okBd:   "#bbf7d0",
  warn:   "#d97706",
  warnBg: "#fff7ed",
  warnBd: "#fed7aa",
  err:    "#dc2626",
  errBg:  "#fef2f2",
  errBd:  "#fecaca",
  errLt:  "#fff1f2",
  warnLt: "#fffbeb",

  /* ── Sidebar (donker paars) ─────────────────────────────────── */
  sidebarBg:    "#2d1333",
  sidebarBd:    "#4a1f52",
  sidebarItem:  "#c9a5d4",   // inactief label
  sidebarMute:  "#7a5580",   // admin-sectie labels
  sidebarActive:"#4d1d58",   // actieve achtergrond
  sidebarAccent:"#bf7fd4",   // actieve indicator-streep

  /* ── Typografie ─────────────────────────────────────────────── */
  fontBody:   "ui-sans-serif, system-ui, -apple-system, sans-serif",
  szBase:     14,    // px — body
  szSm:       13,    // px — secondary
  szXs:       12,    // px — labels, badges
  szXxs:      11,    // px — meta
  szLg:       16,    // px — pagina-titels
  szXl:       20,    // px — grote koppen

  /* ── Geometrie ──────────────────────────────────────────────── */
  radius:   8,
  radiusLg: 12,
  radiusXl: 14,
};

export default T;
