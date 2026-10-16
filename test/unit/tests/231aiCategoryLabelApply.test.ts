import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import * as NodeDef from '@core/survey/nodeDef'

import type { CategoryItemLabelsUpdateAnswer } from '@common/ai/categoryItemLabels'
import { applyChangeSet } from '@webapp/ai/changeSets/applyChangeSet'
import type { CategoryLabelsApplierDeps } from '@webapp/ai/changeSets/categoryItemLabels/applyCategoryItemLabels'
import { createCategoryLabelsApplierDeps } from '@webapp/ai/changeSets/categoryItemLabels/categoryLabelsApplierDeps'
import { summarizeResults } from '@webapp/ai/changeSets/describeOperation'
import type { ChangeSet } from '@webapp/ai/changeSets/types'
import { surveyCategoryUpdated } from '@webapp/store/survey/actions/category'
import { resetSurveyDefs } from '@webapp/store/survey/actions/defs'
import { metaUpdated } from '@webapp/store/survey/actions/metadata'
import { getDefByName } from '@test/unit/utils/assistantTestUtils'
import {
  buildCategoryLabelsSurvey,
  categoryLabelChangeSet,
  categoryLabelOp,
  categoryUuidOf,
  createApplierDepsStub,
} from '@test/unit/utils/categoryLabelsTestUtils'

let survey: any
let speciesUuid: string

beforeAll(async () => {
  survey = await buildCategoryLabelsSurvey()
  speciesUuid = categoryUuidOf(survey, 'species')
})

const op = (id: string, ref: string, overrides: Record<string, unknown> = {}) =>
  categoryLabelOp({ id, categoryUuid: speciesUuid, ref, ...overrides })

const answerOf = (overrides: Partial<CategoryItemLabelsUpdateAnswer> = {}): CategoryItemLabelsUpdateAnswer => ({
  applied: [],
  conflicts: [],
  categories: [],
  ...overrides,
})

// category dependencies whose request answers (or throws) the given value
const createCategoryDeps = (answer: CategoryItemLabelsUpdateAnswer | Error): CategoryLabelsApplierDeps => ({
  putCategoryItemLabels: jest.fn(async () => {
    if (answer instanceof Error) throw answer
    return answer
  }),
  onCategoriesUpdated: jest.fn(),
  onCategoryLabelsApplied: jest.fn(),
})

const apply = (
  changeSet: ChangeSet,
  operationIds: string[],
  categoryLabels: CategoryLabelsApplierDeps,
  target = survey
) => applyChangeSet({ changeSet, operationIds, deps: createApplierDepsStub(target, { categoryLabels }) })

describe('Apply of category item labels (231)', () => {
  test('maps the server answer to results: applied, conflicts with the current text, unanswered ones failed', async () => {
    const category = Survey.getCategoryByUuid(speciesUuid)(survey)
    const changeSet = categoryLabelChangeSet([
      op('c1', '1'),
      op('c2', '1.2'),
      op('c3', '2.1'),
      op('c4', '2', { lang: 'es', expectedText: '  ' }),
    ])
    const categoryLabels = createCategoryDeps(
      answerOf({
        applied: [{ itemUuid: 'item-1', lang: 'fr' }],
        conflicts: [
          { itemUuid: 'item-1.2', lang: 'fr', reason: 'valueChanged', currentText: 'Acacia du Sénégal' },
          { itemUuid: 'item-2.1', lang: 'fr', reason: 'itemMissing', currentText: null },
        ],
        categories: [category],
      })
    )

    const results = await apply(changeSet, ['c1', 'c2', 'c3', 'c4'], categoryLabels)

    expect(results).toEqual([
      { id: 'c1', status: 'applied' },
      { id: 'c2', status: 'conflict', message: 'valueChanged', params: { currentText: 'Acacia du Sénégal' } },
      { id: 'c3', status: 'conflict', message: 'itemMissing', params: { currentText: null } },
      { id: 'c4', status: 'failed', message: 'missingResult' },
    ])
    expect(categoryLabels.putCategoryItemLabels).toHaveBeenCalledTimes(1)
    expect(categoryLabels.putCategoryItemLabels).toHaveBeenCalledWith({
      surveyId: 7,
      items: [
        { itemUuid: 'item-1', lang: 'fr', text: '1 (fr)', expectedText: null },
        { itemUuid: 'item-1.2', lang: 'fr', text: '1.2 (fr)', expectedText: null },
        { itemUuid: 'item-2.1', lang: 'fr', text: '2.1 (fr)', expectedText: null },
        { itemUuid: 'item-2', lang: 'es', text: '2 (es)', expectedText: '  ' },
      ],
    })
    expect(categoryLabels.onCategoriesUpdated).toHaveBeenCalledWith([category])
    expect(categoryLabels.onCategoryLabelsApplied).toHaveBeenCalledTimes(1)
    expect(summarizeResults({ changeSet, results, survey })).toContain(
      'category `species` item 1.2 label (fr): conflict (valueChanged)'
    )
  })

  test('an uppercase item uuid matches the lower-cased server answer', async () => {
    const categoryLabels = createCategoryDeps(answerOf({ applied: [{ itemUuid: 'item-1', lang: 'fr' }] }))
    const results = await apply(
      categoryLabelChangeSet([{ ...op('c1', '1'), itemUuid: 'ITEM-1' }]),
      ['c1'],
      categoryLabels
    )
    expect(results).toEqual([{ id: 'c1', status: 'applied' }])
  })

  test('sends only the selected operations, after the node definition saves', async () => {
    const order: string[] = []
    const clusterIdUuid = NodeDef.getUuid(getDefByName(survey, 'cluster_id'))
    const changeSet = categoryLabelChangeSet([
      {
        id: 'l1',
        type: 'label.set',
        nodeDefUuid: clusterIdUuid,
        kind: 'labels',
        lang: 'fr',
        from: null,
        to: 'Identifiant',
      },
      op('c1', '1'),
      op('c2', '1.2'),
    ])
    const categoryLabels: CategoryLabelsApplierDeps = {
      putCategoryItemLabels: jest.fn(async () => {
        order.push('categories')
        return answerOf({ applied: [{ itemUuid: 'item-1.2', lang: 'fr' }] })
      }),
      onCategoriesUpdated: jest.fn(),
      onCategoryLabelsApplied: jest.fn(),
    }
    const put = categoryLabels.putCategoryItemLabels as jest.Mock
    const deps = createApplierDepsStub(survey, {
      categoryLabels,
      putNodeDefProps: async () => {
        order.push('nodeDef')
      },
    })

    const results = await applyChangeSet({ changeSet, operationIds: ['l1', 'c2'], deps })

    expect(order).toEqual(['nodeDef', 'categories'])
    expect(put.mock.calls[0][0].items.map((item: any) => item.itemUuid)).toEqual(['item-1.2'])
    expect(results).toEqual([
      { id: 'l1', status: 'applied' },
      { id: 'c2', status: 'applied' },
    ])
    expect(categoryLabels.onCategoriesUpdated).not.toHaveBeenCalled()
    expect(categoryLabels.onCategoryLabelsApplied).toHaveBeenCalledTimes(1)
  })

  test('a request error fails every category operation with the server message; nothing is refreshed', async () => {
    const changeSet = categoryLabelChangeSet([op('c1', '1'), op('c2', '1.2')])
    const refused = Object.assign(new Error('Request failed with status code 400'), {
      response: { data: { key: 'appErrors:categoryItemLabelsInvalid', params: { reason: 'text' } } },
    })
    const categoryLabels = createCategoryDeps(refused)
    expect(await apply(changeSet, ['c1', 'c2'], categoryLabels)).toEqual([
      { id: 'c1', status: 'failed', message: 'appErrors:categoryItemLabelsInvalid', params: { reason: 'text' } },
      { id: 'c2', status: 'failed', message: 'appErrors:categoryItemLabelsInvalid', params: { reason: 'text' } },
    ])
    expect(categoryLabels.onCategoriesUpdated).not.toHaveBeenCalled()
    expect(categoryLabels.onCategoryLabelsApplied).not.toHaveBeenCalled()

    expect(await apply(changeSet, ['c1'], createCategoryDeps(new Error('Network Error')))).toEqual([
      { id: 'c1', status: 'failed', message: 'aiAssistant.card.applyFailed', params: { message: 'Network Error' } },
    ])
  })

  test('another survey is open: skipped, nothing sent', async () => {
    const categoryLabels = createCategoryDeps(answerOf())
    const results = await apply(categoryLabelChangeSet([op('c1', '1')]), ['c1'], categoryLabels, { ...survey, id: 8 })
    expect(results).toEqual([{ id: 'c1', status: 'skipped', message: 'surveyChanged' }])
    expect(categoryLabels.putCategoryItemLabels).not.toHaveBeenCalled()
  })

  test('nothing written: no store refresh, no suggestion event', async () => {
    const categoryLabels = createCategoryDeps(
      answerOf({ conflicts: [{ itemUuid: 'item-1', lang: 'fr', reason: 'valueChanged', currentText: 'Acacia' }] })
    )
    await apply(categoryLabelChangeSet([op('c1', '1')]), ['c1'], categoryLabels)
    expect(categoryLabels.onCategoriesUpdated).not.toHaveBeenCalled()
    expect(categoryLabels.onCategoryLabelsApplied).not.toHaveBeenCalled()
  })

  test('the app dependencies keep the item count, mark the survey draft, reset the defs and notify the suggestions', () => {
    const existing = Survey.getCategoryByUuid(speciesUuid)(survey)
    const loaded = Survey.assocCategory(Category.assocItemsCount(120)(existing))(survey)
    const dispatch = jest.fn()
    const notify = jest.fn()
    const put = jest.fn()
    const deps = createCategoryLabelsApplierDeps({ dispatch, getSurvey: () => loaded, put, notify })
    expect(deps.putCategoryItemLabels).toBe(put)

    // the endpoint returns the category without its item count
    deps.onCategoriesUpdated([existing])
    expect(dispatch.mock.calls.map(([action]) => action)).toEqual([
      surveyCategoryUpdated(Category.assocItemsCount(120)(existing)),
      metaUpdated(),
      resetSurveyDefs(),
    ])
    deps.onCategoryLabelsApplied()
    expect(notify).toHaveBeenCalledWith({ type: 'categoryLabelsApplied' })
  })
})
