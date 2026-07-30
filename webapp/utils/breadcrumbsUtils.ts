type ComputeBreadcrumbsMaxItemsParams = {
  containerWidth: number
  itemCount: number
  crumbMinWidthPx: number
  /** Extra width reserved for controls such as a condensed-menu button. */
  reservedWidthPx?: number
  /**
   * Max items to show when container width is unknown.
   * Defaults to itemCount (show all until measured).
   */
  fallbackMaxItems?: number
}

/**
 * Computes how many breadcrumb items fit in the container width.
 * Always keeps at least the first and the last item visible when collapsing.
 *
 * @param params - Width, item count, and sizing options.
 * @returns Number of items to pass to MUI Breadcrumbs maxItems (or equivalent).
 */
export const computeBreadcrumbsMaxItems = ({
  containerWidth,
  itemCount,
  crumbMinWidthPx,
  reservedWidthPx = 0,
  fallbackMaxItems,
}: ComputeBreadcrumbsMaxItemsParams): number => {
  if (itemCount <= 2) return itemCount
  if (containerWidth <= 0) {
    return Math.min(itemCount, fallbackMaxItems ?? itemCount)
  }
  const available = containerWidth - crumbMinWidthPx * 2 - reservedWidthPx
  const middleCount = Math.max(0, Math.floor(available / crumbMinWidthPx))
  return Math.min(itemCount, Math.max(2, 2 + middleCount))
}
