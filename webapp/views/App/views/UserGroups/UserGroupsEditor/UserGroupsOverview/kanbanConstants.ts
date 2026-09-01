/**
 * Sentinel key for the "Unassigned users" Kanban column: used as its React key, as the
 * `data-group-uuid` attribute on its drop-target container, and mapped back to `null` (the
 * API's "no group" value) when a card is dropped into or out of it.
 */
export const UNASSIGNED_GROUP_KEY = '__unassigned__'
