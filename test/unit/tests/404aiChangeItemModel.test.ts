import type { ReviewItem } from '@webapp/components/ai/Assistant/changeSetReviewModel'
import {
  getCategoryUuid,
  getItemDetailLines,
  getItemLang,
  getResultTitle,
  isCategoryItem,
  splitReviewItems,
} from '@webapp/components/ai/Assistant/changeItemModel'
import { fakeT as t } from '../utils/fakeT'

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

  // a fake t: the key and its params, so the test sees what is translated

  test('the title of a result is its message, plus the text found when a label changed meanwhile', () => {
    expect(getResultTitle(null, t)).toBeUndefined()
    expect(getResultTitle({ id: 'a', status: 'applied' }, t)).toBeUndefined()
    expect(getResultTitle({ id: 'a', status: 'failed', message: 'boom' }, t)).toBe('boom')
    expect(getResultTitle({ id: 'a', status: 'conflict', message: 'changed', params: { currentText: 'now' } }, t)).toBe(
      'changed: now'
    )
    // the text found only explains a conflict
    expect(getResultTitle({ id: 'a', status: 'applied', params: { currentText: 'now' } }, t)).toBeUndefined()
  })

  test('a plain conflict reason is translated to its sentence', () => {
    for (const reason of [
      'nodeDefMissing',
      'valueChanged',
      'parentMissing',
      'nameTaken',
      'alreadyExists',
      'refMissing',
      'itemMissing',
      'surveyDirty',
      'surveyChanged',
      'dependencyNotApplied',
    ]) {
      expect(getResultTitle({ id: 'a', status: 'conflict', message: reason }, t)).toBe(
        `aiAssistant.card.reason.${reason}`
      )
    }
  })

  test('a conflict whose message is an i18n key is translated with its params', () => {
    expect(
      getResultTitle(
        { id: 'a', status: 'conflict', message: 'aiAssistant.issues.refEditDisabled', params: { name: 'tree' } },
        t
      )
    ).toBe('aiAssistant.issues.refEditDisabled{"name":"tree"}')
    expect(
      getResultTitle({ id: 'a', status: 'conflict', message: 'validationErrors:nodeDefEdit.nameInvalid' }, t)
    ).toBe('validationErrors:nodeDefEdit.nameInvalid')
  })

  test('the details of a new node definition are listed with their translated titles', () => {
    const item: ReviewItem = {
      ...nodeDefItem('tree_height'),
      details: [
        { titleKey: 'aiAssistant.card.props.key', titleParams: {}, value: { kind: 'boolean', value: true } },
        { titleKey: 'aiAssistant.card.label', titleParams: { lang: 'fr' }, value: { kind: 'text', text: 'Hauteur' } },
      ],
    }
    expect(getItemDetailLines(item, t)).toEqual([
      {
        key: '0-aiAssistant.card.props.key-',
        title: 'aiAssistant.card.props.key{}',
        value: { kind: 'boolean', value: true },
      },
      {
        key: '1-aiAssistant.card.label-fr',
        title: 'aiAssistant.card.label{"lang":"fr"}',
        value: { kind: 'text', text: 'Hauteur' },
      },
    ])
    expect(getItemDetailLines(nodeDefItem('plain'), t)).toEqual([])
  })
})
