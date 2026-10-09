import * as Survey from '@core/survey/survey'
import { toQuery } from '@common/ai/tasks/dataQuery'

import { buildQueryCardModel } from '@webapp/components/ai/Assistant/analysis/queryCardModel'

import en from '@core/i18n/resources/en'
import es from '@core/i18n/resources/es'
import fr from '@core/i18n/resources/fr'
import ja from '@core/i18n/resources/ja'
import mn from '@core/i18n/resources/mn'
import pt from '@core/i18n/resources/pt'
import ru from '@core/i18n/resources/ru'

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

/**
 * Returns the sorted key paths of an object.
 */
const keyPaths = (obj: object, prefix = ''): string[] =>
  Object.entries(obj)
    .flatMap(([key, value]) =>
      value && typeof value === 'object' ? keyPaths(value, `${prefix}${key}.`) : [`${prefix}${key}`]
    )
    .sort()

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
    const enKeys = keyPaths(en.common.aiAnalysis)
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
        'recordDataShared',
      ].sort()
    )
    for (const resources of [es, fr, ja, mn, pt, ru]) {
      const section = resources.common.aiAnalysis
      expect(keyPaths(section)).toEqual(enKeys)
      for (const path of enKeys) {
        const value = path.split('.').reduce((acc, key) => acc[key], section)
        expect(String(value).trim().length).toBeGreaterThan(0)
      }
    }
  })

  test('ru and mn are written in Cyrillic', () => {
    for (const resources of [ru, mn]) {
      expect(resources.common.aiAnalysis.recordDataShared).toMatch(/[Ѐ-ӿ]/)
    }
  })
})
