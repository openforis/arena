export const _isPlaceholder = (a: unknown): boolean =>
  a != null && typeof a === 'object' && (a as Record<string, unknown>)['@@functional/placeholder'] === true
