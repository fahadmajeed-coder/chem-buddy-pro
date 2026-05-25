// Single source of truth for the admin gate.
// NOTE: This is a client-side convenience gate (the app is offline-first PWA).
// Real authorization happens server-side in the sync-data edge function,
// which keeps its own copy of the secret and is the only path that can mutate
// shared Cloud data.
export const ADMIN_PASSWORD = 'ChemAdmin2024';
