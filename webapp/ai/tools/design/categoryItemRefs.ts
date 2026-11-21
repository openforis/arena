/**
 * Refs of the category items listed to the model, per conversation. categoryItems_listMissingLabels registers each
 * item it reads (code path → uuid, level, labels); categoryItemLabels_proposeSet resolves the model's refs with them.
 * In memory only: the browser never holds the items of large categories, and the model lists them again after a
 * reload.
 */

export type CategoryItemRefEntry = { itemUuid: string; levelName: string; labels: Record<string, string> }

type RefKey = { surveyId: number; categoryUuid: string; ref: string }

export type CategoryItemRefs = {
  register: (params: RefKey & { entry: CategoryItemRefEntry }) => void
  get: (params: RefKey) => CategoryItemRefEntry | null
  isAmbiguous: (params: RefKey) => boolean
}

export type CategoryItemRefsRegistry = {
  forConversation: (conversationId: string) => CategoryItemRefs
  clearAll: () => void
}

// conversations kept, most recently used first; a dropped one lists its items again
export const CATEGORY_ITEM_REFS_MAX_CONVERSATIONS = 20
// entries kept per conversation, latest first (5 pages of 100 items per list call at most)
export const CATEGORY_ITEM_REFS_MAX_ENTRIES = 5000

/**
 * Returns the map key of a ref.
 * @param {RefKey} key - Survey, category and ref.
 * @returns {string} The key.
 */
const toKey = ({ surveyId, categoryUuid, ref }: RefKey): string => `${surveyId}|${categoryUuid}|${ref}`

/**
 * Creates the refs of one conversation.
 * @returns {CategoryItemRefs} The refs.
 */
export const createCategoryItemRefs = (): CategoryItemRefs => {
  const entries = new Map<string, CategoryItemRefEntry>()
  // refs shared by several items (dotted or duplicated codes): never resolved
  const ambiguous = new Set<string>()
  return {
    register: ({ entry, ...key }) => {
      const mapKey = toKey(key)
      const existing = entries.get(mapKey)
      if (ambiguous.has(mapKey) || (existing && existing.itemUuid !== entry.itemUuid)) {
        entries.delete(mapKey)
        ambiguous.add(mapKey)
        return
      }
      // re-inserted, so it counts as the latest
      entries.delete(mapKey)
      entries.set(mapKey, entry)
      if (entries.size > CATEGORY_ITEM_REFS_MAX_ENTRIES) entries.delete(entries.keys().next().value as string)
    },
    get: (key) => entries.get(toKey(key)) ?? null,
    isAmbiguous: (key) => ambiguous.has(toKey(key)),
  }
}

/**
 * Creates a registry of refs by conversation.
 * @param {number} [maxConversations] - Conversations kept.
 * @returns {CategoryItemRefsRegistry} The registry.
 */
export const createCategoryItemRefsRegistry = (
  maxConversations: number = CATEGORY_ITEM_REFS_MAX_CONVERSATIONS
): CategoryItemRefsRegistry => {
  const byConversation = new Map<string, CategoryItemRefs>()
  return {
    forConversation: (conversationId) => {
      const refs = byConversation.get(conversationId) ?? createCategoryItemRefs()
      // re-inserted, so it counts as the most recently used
      byConversation.delete(conversationId)
      byConversation.set(conversationId, refs)
      if (byConversation.size > maxConversations) byConversation.delete(byConversation.keys().next().value as string)
      return refs
    },
    clearAll: () => byConversation.clear(),
  }
}

export const categoryItemRefsRegistry = createCategoryItemRefsRegistry()
