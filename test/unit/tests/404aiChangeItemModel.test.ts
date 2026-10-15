import type { ReviewItem } from '@webapp/components/ai/Assistant/changeSetReviewModel'
import {
  getCategoryUuid,
  getItemLang,
  getResultTitle,
  isCategoryItem,
  splitReviewItems,
} from '@webapp/components/ai/Assistant/changeItemModel'

const nodeDefItem = (id: string, nodeDefUuid = `uuid-${id}`): ReviewItem => ({
  id,
  name: id,
  detail: null,
  nodeDefUuid,
  field: { key: 'aiAssistant.card.label', params: { lang: 'en' } },
  from: null,
  to: { kind: 'text', text: 'x' },
  result: null,
  groupKey: 'entity:e1',
  groupName: 'cluster',
})

const categoryItem = (id: string, categoryUuid: string, categoryName: string, lang = 'fr'): ReviewItem => ({
  id,
  name: `ref-${id}`,
  detail: 'level 1',
  nodeDefUuid: null,
  field: { key: 'aiAssistant.card.label', params: { lang } },
  from: { kind: 'text', text: null },
  to: { kind: 'text', text: 'y' },
  result: null,
  groupKey: `category:${categoryUuid}`,
  groupName: categoryName,
})

describe('change item model (404)', () => {
  test('a category item is the one without a node definition', () => {
    expect(isCategoryItem(categoryItem('c1', 'cat-1', 'sex'))).toBe(true)
    expect(isCategoryItem(nodeDefItem('a'))).toBe(false)
  })

  test('the category and the language of an item come from its group and its field', () => {
    const item = categoryItem('c1', 'cat-1', 'sex', 'es')
    expect(getCategoryUuid(item)).toBe('cat-1')
    expect(getItemLang(item)).toBe('es')
  })

  test('items are split into node definition changes and one group per category, in order of appearance', () => {
    const items = [
      nodeDefItem('a'),
      categoryItem('c1', 'cat-1', 'sex'),
      nodeDefItem('b'),
      categoryItem('c2', 'cat-2', 'region'),
      categoryItem('c3', 'cat-1', 'sex', 'es'),
    ]
    const { nodeDefItems, categoryGroups } = splitReviewItems(items)
    expect(nodeDefItems.map(({ id }) => id)).toEqual(['a', 'b'])
    expect(categoryGroups.map(({ categoryUuid, categoryName }) => [categoryUuid, categoryName])).toEqual([
      ['cat-1', 'sex'],
      ['cat-2', 'region'],
    ])
    expect(categoryGroups[0].items.map(({ id }) => id)).toEqual(['c1', 'c3'])
  })

  test('nothing to split gives empty lists', () => {
    expect(splitReviewItems([])).toEqual({ nodeDefItems: [], categoryGroups: [] })
  })

  test('the title of a result is its message, plus the text found when a label changed meanwhile', () => {
    expect(getResultTitle(null)).toBeUndefined()
    expect(getResultTitle({ id: 'a', status: 'applied' })).toBeUndefined()
    expect(getResultTitle({ id: 'a', status: 'failed', message: 'boom' })).toBe('boom')
    expect(getResultTitle({ id: 'a', status: 'conflict', message: 'changed', params: { currentText: 'now' } })).toBe(
      'changed: now'
    )
    // the text found only explains a conflict
    expect(getResultTitle({ id: 'a', status: 'applied', params: { currentText: 'now' } })).toBeUndefined()
  })
})
