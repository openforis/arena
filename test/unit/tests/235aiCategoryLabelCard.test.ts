import * as Survey from '@core/survey/survey'

import type { ChangeSetCardState } from '@webapp/ai/changeSets/types'
import { buildCategoryLabelGroups } from '@webapp/components/ai/Assistant/categoryLabelCardModel'
import {
  buildCardRows,
  getConflictingOperationIds,
  getPendingOperationIds,
} from '@webapp/components/ai/Assistant/changeSetCardModel'

import {
  buildCategoryLabelsSurvey,
  categoryLabelChangeSet,
  categoryLabelOp,
  categoryUuidOf,
} from '@test/unit/utils/categoryLabelsTestUtils'

let survey: any
let speciesUuid: string
let landUseUuid: string

beforeAll(async () => {
  survey = await buildCategoryLabelsSurvey()
  speciesUuid = categoryUuidOf(survey, 'species')
  landUseUuid = categoryUuidOf(survey, 'land_use')
})

/**
 * Builds the card state of three label operations: species 1, land_use 3, species 1.2.
 * @param {object} [extra] - Results or discarded flag.
 * @returns {ChangeSetCardState} The card state.
 */
const cardOf = (extra: Partial<ChangeSetCardState> = {}): ChangeSetCardState => ({
  changeSet: categoryLabelChangeSet([
    categoryLabelOp({ id: 'c1', categoryUuid: speciesUuid, ref: '1', text: 'Pin' }),
    categoryLabelOp({ id: 'c2', categoryUuid: landUseUuid, ref: '3', levelName: 'class', text: 'Forêt' }),
    categoryLabelOp({
      id: 'c3',
      categoryUuid: speciesUuid,
      ref: '1.2',
      levelName: 'species',
      text: 'Pin noir',
      expectedText: 'Pin noire',
    }),
  ]),
  ...extra,
})

describe('category label card (235)', () => {
  test('groups the label operations by category, in proposal order, with the current and proposed text and the result', () => {
    const groups = buildCategoryLabelGroups({
      cardState: cardOf({
        results: [
          { id: 'c1', status: 'applied' },
          { id: 'c3', status: 'conflict', message: 'valueChanged', params: { currentText: 'Pin de Corse' } },
        ],
      }),
      survey,
    })
    expect(groups.map((group) => group.categoryName)).toEqual(['species', 'land_use'])
    expect(groups[0]).toMatchObject({
      categoryUuid: speciesUuid,
      rows: [
        { id: 'c1', ref: '1', levelName: 'genus', lang: 'fr', from: null, to: 'Pin', currentText: null },
        { id: 'c3', ref: '1.2', levelName: 'species', from: 'Pin noire', to: 'Pin noir', currentText: 'Pin de Corse' },
      ],
    })
    expect(groups[0].rows[0].result).toEqual({ id: 'c1', status: 'applied' })
    expect(groups[1].rows).toEqual([expect.objectContaining({ id: 'c2', ref: '3', result: null })])
  })

  test('a deleted category shows its uuid; label operations stay out of the node definition rows, pending and never conflicting', () => {
    const withoutLandUse = Survey.assocCategories(
      Object.fromEntries(
        Survey.getCategoriesArray(survey)
          .filter((category: any) => category.uuid !== landUseUuid)
          .map((category: any) => [category.uuid, category])
      )
    )(survey)
    const groups = buildCategoryLabelGroups({ cardState: cardOf(), survey: withoutLandUse })
    expect(groups[1].categoryName).toBe(landUseUuid)

    const cardState = cardOf({ results: [{ id: 'c1', status: 'applied' }] })
    expect(buildCardRows({ cardState, survey, lang: 'en' })).toEqual([])
    expect(getPendingOperationIds(cardState)).toEqual(['c2', 'c3'])
    expect(getConflictingOperationIds({ cardState, survey })).toEqual([])
    expect(getPendingOperationIds(cardOf({ discarded: true }))).toEqual([])
  })
})
