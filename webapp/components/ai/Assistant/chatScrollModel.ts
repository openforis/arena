/**
 * Scroll of the chat while an answer streams (pure): follow it only when the user is reading the end.
 */

// pixels short of the end that still count as the end (scroll positions are fractional on zoomed screens)
export const BOTTOM_THRESHOLD_PX = 40

export type ScrollMetrics = { scrollTop: number; clientHeight: number; scrollHeight: number }

/**
 * Tells whether a scrollable list shows its end.
 * @param {ScrollMetrics} metrics - Scroll position and sizes of the list.
 * @param {number} [threshold] - Pixels short of the end that still count as the end.
 * @returns {boolean} True when the user is at the end (or there is nothing to scroll).
 */
export const isNearBottom = (
  { scrollTop, clientHeight, scrollHeight }: ScrollMetrics,
  threshold = BOTTOM_THRESHOLD_PX
): boolean => scrollHeight - scrollTop - clientHeight <= threshold
