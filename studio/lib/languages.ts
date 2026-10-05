/**
 * Jedno źródło prawdy dla języków.
 * `de` jest zarezerwowany: architektura go obsługuje, ale w Studio jest wyłączony.
 * Aby go włączyć, zmień `enabled: false` na `true` (istniejące dane nie znikają).
 */
export const LANGUAGES = [
  {id: 'pl', title: 'Polski', enabled: true},
  {id: 'en', title: 'English', enabled: true},
  {id: 'de', title: 'Deutsch', enabled: false},
] as const

export const ENABLED_LANGUAGES = LANGUAGES.filter((l) => l.enabled)
export const DEFAULT_LANGUAGE = 'pl'
export const API_VERSION = '2025-02-19'

export type LanguageId = (typeof LANGUAGES)[number]['id']
