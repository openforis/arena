export interface GridLayoutItem {
  i: string
  x: number
  y: number
  w: number
  h: number
}

const collides = (a: GridLayoutItem, b: GridLayoutItem): boolean =>
  a.i !== b.i && a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y

const findFirstCollision = (item: GridLayoutItem, placedItems: GridLayoutItem[]): GridLayoutItem | undefined =>
  placedItems.find((placedItem) => collides(item, placedItem))

const compareByPosition = (a: GridLayoutItem, b: GridLayoutItem): number => a.y - b.y || a.x - b.x

/**
 * Moves down the items overlapping the resized one (and, in cascade, the items overlapping the moved ones).
 * Items start from their position at resize start, so they move back up when the resized item shrinks again.
 *
 * @param {object} params - The parameters.
 * @param {GridLayoutItem[]} params.layout - The current layout (with the resized item at its new size).
 * @param {GridLayoutItem} params.resizedItem - The item being resized.
 * @param {GridLayoutItem[]} params.layoutAtResizeStart - The layout at resize start.
 * @returns {GridLayoutItem[]} - The layout with no overlapping items, in the same order as the given one.
 */
export const pushDownItemsOverlappingResizedItem = <T extends GridLayoutItem>({
  layout,
  resizedItem,
  layoutAtResizeStart,
}: {
  layout: T[]
  resizedItem: GridLayoutItem
  layoutAtResizeStart: GridLayoutItem[]
}): T[] => {
  const yAtResizeStartByKey = new Map(layoutAtResizeStart.map((item) => [item.i, item.y]))
  const otherItems = layout
    .filter((item) => item.i !== resizedItem.i)
    .map((item) => ({ ...item, y: yAtResizeStartByKey.get(item.i) ?? item.y }))
    .sort(compareByPosition)

  const placedItems: GridLayoutItem[] = [resizedItem]
  const itemsByKey = new Map<string, T>()
  for (const item of otherItems) {
    let collision = findFirstCollision(item, placedItems)
    while (collision) {
      item.y = collision.y + collision.h
      collision = findFirstCollision(item, placedItems)
    }
    placedItems.push(item)
    itemsByKey.set(item.i, item)
  }
  return layout.map((item) => itemsByKey.get(item.i) ?? item)
}
