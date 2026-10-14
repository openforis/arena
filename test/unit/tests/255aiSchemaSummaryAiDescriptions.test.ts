// test/unit/tests/255aiSchemaSummaryAiDescriptions.test.ts
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import { AiLimits } from '@common/ai/limits'

import enErrors from '@core/i18n/resources/en/appErrors'
import esErrors from '@core/i18n/resources/es/appErrors'
import frErrors from '@core/i18n/resources/fr/appErrors'
import jaErrors from '@core/i18n/resources/ja/appErrors'
import mnErrors from '@core/i18n/resources/mn/appErrors'
import ptErrors from '@core/i18n/resources/pt/appErrors'
import ruErrors from '@core/i18n/resources/ru/appErrors'

import {
  assertNoLegacyIncludeAiDescriptions,
  parseAiDescriptions,
  parseAiDescriptionsFailedCount,
} from '@server/modules/survey/service/schemaSummary/aiDescriptions'
import {
  buildSchemaSummaryItems,
  getSchemaSummaryAiItems,
} from '@server/modules/survey/service/schemaSummary/schemaSummary'

import { expectSystemErrorKey } from '@test/unit/utils/aiTestUtils'
import * as SB from '../../utils/surveyBuilder'

const user = { uuid: 'test-schema-summary-ai-user' }
const { decimal } = NodeDef.nodeDefType
const cycle = Survey.cycleOneKey
const errorsByLang: Record<string, any> = {
  en: enErrors,
  es: esErrors,
  fr: frErrors,
  ja: jaErrors,
  mn: mnErrors,
  pt: ptErrors,
  ru: ruErrors,
}

/**
 * Builds cluster (root) → cluster_id, notes (described), plot (multiple) → plot_dbh.
 * @returns {Promise<object>} The survey.
 */
const buildSurvey = () =>
  SB.survey(
    user,
    SB.entity(
      'cluster',
      SB.attribute('cluster_id', decimal).label('Id'),
      SB.attribute('notes').label('Notes').prop(NodeDef.propKeys.descriptions, { en: 'Free notes' }),
      SB.entity('plot', SB.attribute('plot_dbh', decimal).label('DBH')).label('Plot').multiple()
    ).label('Cluster')
  ).build()

const uuidOf = (survey: any, name: string): string =>
  NodeDef.getUuid(Survey.getNodeDefsArray(survey).find((nodeDef: any) => NodeDef.getName(nodeDef) === name))

const known = ['u1', 'u2']

describe('schema summary AI descriptions on the server (255)', () => {
  test('the AI items are the node defs without a description, with their parent path', async () => {
    const survey = await buildSurvey()
    const { surveyName, nodeDefs } = getSchemaSummaryAiItems({ survey, cycle })
    expect(surveyName).toBe(Survey.getName(Survey.getSurveyInfo(survey)))
    expect([...nodeDefs].sort((a, b) => a.name.localeCompare(b.name))).toEqual([
      { uuid: uuidOf(survey, 'cluster_id'), name: 'cluster_id', type: 'decimal', parentPath: '' },
      { uuid: uuidOf(survey, 'plot'), name: 'plot', type: 'entity', parentPath: '' },
      { uuid: uuidOf(survey, 'plot_dbh'), name: 'plot_dbh', type: 'decimal', parentPath: 'plot' },
    ])
  })

  test('at most AiLimits.dataDictionaryMaxDescriptions AI items', async () => {
    const survey = await SB.survey(
      user,
      SB.entity('root', ...Array.from({ length: 205 }, (_v, i) => SB.attribute(`a_${i}`)))
    ).build()
    expect(getSchemaSummaryAiItems({ survey, cycle }).nodeDefs).toHaveLength(AiLimits.dataDictionaryMaxDescriptions)
  })

  test('the export writes the AI descriptions in the aiDescription column', async () => {
    const survey = await buildSurvey()
    const items = buildSchemaSummaryItems({
      survey,
      cycle,
      aiDescriptions: { [uuidOf(survey, 'cluster_id')]: 'The cluster number.' },
    })
    const byName = Object.fromEntries(items.map((item: any) => [item.name, item]))
    expect(byName.cluster_id.aiDescription).toBe('The cluster number.')
    expect(byName.plot_dbh.aiDescription).toBe('')
    expect(byName.notes.description_en).toBe('Free notes')

    const withoutAi = buildSchemaSummaryItems({ survey, cycle })
    expect(withoutAi.some((item: any) => 'aiDescription' in item)).toBe(false)
  })

  test('parseAiDescriptions keeps a valid map', () => {
    const longest = 'x'.repeat(AiLimits.dataDictionaryMaxDescriptionChars)
    expect(parseAiDescriptions({ raw: { u1: 'One.', u2: longest }, knownUuids: known })).toEqual({
      u1: 'One.',
      u2: longest,
    })
    expect(parseAiDescriptions({ raw: {}, knownUuids: known })).toEqual({})
  })

  test.each([
    ['an array', []],
    ['a string', 'x'],
    ['null', null],
    ['an unknown uuid', { other: 'Foreign.' }],
    ['a description that is not a string', { u1: 3 }],
    ['a description over the limit', { u1: 'x'.repeat(AiLimits.dataDictionaryMaxDescriptionChars + 1) }],
  ])('rejects %s', async (_name, raw) => {
    const error: any = await expectSystemErrorKey(
      () => parseAiDescriptions({ raw, knownUuids: known }),
      'aiDescriptionsInvalid'
    )
    expect(error.statusCode).toBe(400)
  })

  test('rejects more descriptions than the cap', async () => {
    const uuids = Array.from({ length: AiLimits.dataDictionaryMaxDescriptions + 1 }, (_v, i) => `u${i}`)
    const raw = Object.fromEntries(uuids.map((uuid) => [uuid, 'D.']))
    await expectSystemErrorKey(() => parseAiDescriptions({ raw, knownUuids: uuids }), 'aiDescriptionsInvalid')
  })

  test('the failed count is a whole number within the cap', async () => {
    expect(parseAiDescriptionsFailedCount(undefined)).toBe(0)
    expect(parseAiDescriptionsFailedCount(3)).toBe(3)
    for (const raw of [-1, 1.5, '3', AiLimits.dataDictionaryMaxDescriptions + 1]) {
      await expectSystemErrorKey(() => parseAiDescriptionsFailedCount(raw), 'aiDescriptionsInvalid')
    }
  })

  test('a body with the removed includeAiDescriptions is rejected with a 400, not exported without the column', async () => {
    const error: any = await expectSystemErrorKey(
      () => assertNoLegacyIncludeAiDescriptions({ surveyId: 1, includeAiDescriptions: true }),
      'aiIncludeAiDescriptionsRemoved'
    )
    expect(error.statusCode).toBe(400)
    expect(() => assertNoLegacyIncludeAiDescriptions({ surveyId: 1, aiDescriptions: {} })).not.toThrow()
  })

  test.each(Object.keys(errorsByLang))('%s has the aiIncludeAiDescriptionsRemoved message', (lang) => {
    const text = errorsByLang[lang].aiIncludeAiDescriptionsRemoved
    expect(typeof text).toBe('string')
    const cyrillic = lang === 'ru' || lang === 'mn'
    expect(/[Ѐ-ӿ]/.test(text) || !cyrillic).toBe(true)
  })

  test.each(Object.keys(errorsByLang))('%s has the aiDescriptionsInvalid message', (lang) => {
    const text = errorsByLang[lang].aiDescriptionsInvalid
    expect(typeof text).toBe('string')
    expect(text.length).toBeGreaterThan(0)
    const cyrillic = lang === 'ru' || lang === 'mn'
    expect(/[Ѐ-ӿ]/.test(text) || !cyrillic).toBe(true)
  })
})
