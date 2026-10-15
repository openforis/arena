import * as Survey from '@core/survey/survey'
import { toQuery } from '@common/ai/tasks/dataQuery'

import { buildQueryCardModel } from '@webapp/components/ai/Assistant/analysis/queryCardModel'

import { CYRILLIC, CYRILLIC_LANGUAGES, leafPaths, OTHER_LANGUAGES, RESOURCES } from '../utils/i18nParity'

import * as DataTest from '../../utils/dataTest'
import { getContextUser } from '../../integration/config/context'

let survey: any = null
const cycle = Survey.cycleOneKey

const newEntry = (aiResult: object) => {
  const { query, errors } = toQuery({
    survey,
    cycle,
    lang: 'en',
    aiResult: { attributes: [], dimensions: [], measures: [], filter: null, sort: [], ...aiResult } as any,
  })
  expect(errors).toEqual([])
  return { id: 'q1', query, explanation: 'Explained', entityName: 'tree', mode: 'aggregate', createdAt: 'T' }
}

beforeAll(async () => {
  survey = await DataTest.createTestSurvey({ user: getContextUser() })
})

describe('query card model', () => {
  test('aggregate query', () => {
    const entry = newEntry({
      entity: 'tree',
      mode: 'aggregate',
      dimensions: ['tree_type'],
      measures: [
        { attribute: 'dbh', functions: ['avg', 'max'] },
        { attribute: 'tree', functions: ['cnt'] },
      ],
      filter: 'dbh > 10',
      sort: [{ attribute: 'tree_type', order: 'desc' }],
    })
    const model = buildQueryCardModel({ entry, survey, lang: 'en' })
    expect(model).toEqual({
      queryId: 'q1',
      explanation: 'Explained',
      entity: expect.any(String),
      mode: 'aggregate',
      columns: [],
      dimensions: [expect.any(String)],
      measures: [
        { attribute: expect.any(String), functions: ['avg', 'max'] },
        { attribute: model.entity, functions: ['cnt'] },
      ],
      filter: 'dbh > 10',
      sort: [{ attribute: expect.any(String), order: 'desc' }],
      chartType: 'bar',
    })
  })

  test('raw query', () => {
    const entry = newEntry({ entity: 'tree', mode: 'raw', attributes: ['tree_id', 'tree_status'] })
    const model = buildQueryCardModel({ entry: { ...entry, mode: 'raw' }, survey, lang: 'en' })
    expect(model.mode).toBe('raw')
    expect(model.columns).toHaveLength(2)
    expect(model.dimensions).toEqual([])
    expect(model.filter).toBeNull()
    expect(model.chartType).toBeNull()
  })
})

describe('translations', () => {
  test('every language has the same aiAnalysis keys, all non-empty', () => {
    const enKeys = leafPaths(RESOURCES.en.common.aiAnalysis)
    expect(enKeys).toEqual(
      [
        'area',
        'empty',
        'queryCard.columns',
        'queryCard.filter',
        'queryCard.missing',
        'queryCard.openInExplorer',
        'queryCard.showAsChart',
        'queryCard.title',
        'recordDataNotice.message',
        'recordDataNotice.newConversation',
      ].sort()
    )
    for (const lang of OTHER_LANGUAGES) {
      const section = RESOURCES[lang].common.aiAnalysis
      expect(leafPaths(section)).toEqual(enKeys)
      for (const path of enKeys) {
        const value = path.split('.').reduce((acc, key) => acc[key], section)
        expect(String(value).trim().length).toBeGreaterThan(0)
      }
    }
  })

  test('the Cyrillic languages are written in Cyrillic', () => {
    expect(CYRILLIC_LANGUAGES.length).toBeGreaterThan(0)
    for (const lang of CYRILLIC_LANGUAGES) {
      expect(RESOURCES[lang].common.aiAnalysis.recordDataNotice.message).toMatch(CYRILLIC)
    }
  })
})
