import {
  GridLayoutItem,
  pushDownItemsOverlappingResizedItem,
} from '@webapp/components/survey/SurveyForm/nodeDefs/components/types/gridLayoutPushDown'

const item = (i: string, x: number, y: number, w = 1, h = 1): GridLayoutItem => ({ i, x, y, w, h })

describe('pushDownItemsOverlappingResizedItem', () => {
  // a | b
  // c | d
  // e
  const layoutAtResizeStart = [item('a', 0, 0), item('b', 1, 0), item('c', 0, 1), item('d', 1, 1), item('e', 0, 2)]

  const resize = (resizedItem: GridLayoutItem, layout = layoutAtResizeStart) =>
    pushDownItemsOverlappingResizedItem({
      layout: layout.map((it) => (it.i === resizedItem.i ? resizedItem : it)),
      resizedItem,
      layoutAtResizeStart,
    })

  const positionsByKey = (layout: GridLayoutItem[]) => Object.fromEntries(layout.map(({ i, x, y }) => [i, { x, y }]))

  test('pushes down the items below in cascade, leaving the others in place', () => {
    const result = resize(item('a', 0, 0, 1, 2))
    expect(result.map((it) => it.i)).toEqual(['a', 'b', 'c', 'd', 'e'])
    expect(positionsByKey(result)).toEqual({
      a: { x: 0, y: 0 },
      b: { x: 1, y: 0 },
      c: { x: 0, y: 2 },
      d: { x: 1, y: 1 },
      e: { x: 0, y: 3 },
    })
  })

  test('pushes down the items overlapped when growing in width', () => {
    const result = resize(item('c', 0, 1, 2, 1))
    expect(positionsByKey(result)).toMatchObject({ d: { x: 1, y: 2 }, e: { x: 0, y: 2 } })
  })

  test('moves the items back up when the resized item shrinks again', () => {
    const grown = resize(item('a', 0, 0, 1, 3))
    const result = resize(item('a', 0, 0, 1, 1), grown)
    expect(positionsByKey(result)).toEqual(positionsByKey(layoutAtResizeStart))
  })

  test('does not mutate the given layout items', () => {
    const layout = layoutAtResizeStart.map((it) => ({ ...it }))
    resize(item('a', 0, 0, 1, 2), layout)
    expect(layout).toEqual(layoutAtResizeStart)
  })
})
