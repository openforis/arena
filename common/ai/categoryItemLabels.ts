/**
 * Shapes shared by the category item labels endpoints and the assistant (suggestion 6).
 */

// the most items one page request may ask for
export const MISSING_LABELS_SERVER_PAGE_MAX = 200
export const MISSING_LABELS_SERVER_PAGE_DEFAULT = 50
// the most labels one update request may write (the propose tool's batch limit)
export const CATEGORY_ITEM_LABELS_UPDATE_MAX = 200
export const CATEGORY_ITEM_LABEL_TEXT_MAX = 2000

// categoryUuid → lang → number of items whose label is missing in lang
export type MissingLabelsCounts = Record<string, Record<string, number>>

export type MissingLabelsItem = {
  uuid: string
  levelIndex: number
  levelName: string
  // codes from the first level down to the item, e.g. ["2", "14"]
  codePath: string[]
  // the combined draft labels, every language
  labels: Record<string, string>
}

// total: every item of the category missing the label (whatever the cursor); nextCursor: uuid of the last item
export type MissingLabelsPage = { total: number; items: MissingLabelsItem[]; nextCursor: string | null }

// expectedText: the label in lang when it was listed (null: absent); the write happens only if it is still the same
export type CategoryItemLabelUpdate = { itemUuid: string; lang: string; text: string; expectedText: string | null }

export type CategoryItemLabelConflictReason = 'itemMissing' | 'valueChanged'

export type CategoryItemLabelConflict = {
  itemUuid: string
  lang: string
  reason: CategoryItemLabelConflictReason
  currentText: string | null
}

// categories: the categories of the applied items, as the category endpoints return them (levels, validation)
export type CategoryItemLabelsUpdateAnswer = {
  applied: { itemUuid: string; lang: string }[]
  conflicts: CategoryItemLabelConflict[]
  categories: any[]
}
