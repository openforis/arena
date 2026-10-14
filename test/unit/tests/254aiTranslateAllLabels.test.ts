// test/unit/tests/254aiTranslateAllLabels.test.ts
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import SystemError from '@core/systemError'
import { AiLimits } from '@common/ai/limits'

import { isAiAbortError } from '@webapp/ai/runtime/runtimeErrors'
import { buildTranslationItems, runTranslateAllLabels } from '@webapp/ai/workflows/translateAllLabels'

import * as SB from '../../utils/surveyBuilder'

const user = { uuid: 'test-ai-translate-all-labels-user' }
const generateText = async () => ''
const noGuard = async () => {}

/**
 * Fake translateItems: translates every item into every target language as "<lang>:<text>".
 * @param {object} params - The task parameters.
 * @returns {Promise<object>} The translations.
 */
const translateAll = async ({ targetLangs, items }: any) => ({
  translations: items.map((item: any) => ({
    id: item.id,
    byLang: Object.fromEntries(targetLangs.map((lang: string) => [lang, `${lang}:${item.text}`])),
  })),
})

const uuidOf = (survey: any, name: string): string =>
  NodeDef.getUuid(Survey.getNodeDefsArray(survey).find((nodeDef: any) => NodeDef.getName(nodeDef) === name))

/**
 * Builds a survey whose root has no label and `count` labelled attributes.
 * @param {number} count - Number of attributes.
 * @param {string[]} languages - Survey languages.
 * @returns {Promise<object>} The survey.
 */
const buildWideSurvey = (count: number, languages: string[]) =>
  SB.survey(
    user,
    SB.entity('root', ...Array.from({ length: count }, (_v, i) => SB.attribute(`a_${i}`).label(`Attribute ${i}`)))
  )
    .languages(...languages)
    .build()

describe('translate all labels in the browser (254)', () => {
  test('items: the default-language label and description of each node def; blank texts skipped, texts too long counted', async () => {
    const survey = await SB.survey(
      user,
      SB.entity(
        'cluster',
        SB.attribute('cluster_id').label('Id').prop(NodeDef.propKeys.descriptions, { en: 'The id' }),
        SB.attribute('no_label'),
        SB.attribute('long_desc')
          .label('Long')
          .prop(NodeDef.propKeys.descriptions, { en: 'x'.repeat(2001) })
      ).label('Cluster')
    )
      .languages('en', 'fr')
      .build()
    const { items, itemInfoById, skippedCount } = buildTranslationItems({
      nodeDefs: Survey.getNodeDefsArray(survey),
      defaultLang: 'en',
    })
    const idUuid = uuidOf(survey, 'cluster_id')
    expect(items).toEqual(
      expect.arrayContaining([
        { id: `${idUuid}_label`, text: 'Id', kind: 'nodeDefLabel' },
        { id: `${idUuid}_desc`, text: 'The id', kind: 'nodeDefDescription' },
        { id: `${uuidOf(survey, 'long_desc')}_label`, text: 'Long', kind: 'nodeDefLabel' },
      ])
    )
    expect(items).toHaveLength(4) // cluster, cluster_id label + desc, long_desc label
    expect(itemInfoById[`${idUuid}_desc`]).toEqual({ uuid: idUuid, field: 'description' })
    expect(skippedCount).toBe(1)
    expect(AiLimits.translationItemMaxChars).toBe(2000)
  })

  test('calls: batches of 20 items, each sent to every other language', async () => {
    const survey = await buildWideSurvey(45, ['en', 'fr', 'es'])
    const calls: { size: number; targetLangs: string[] }[] = []
    const progress: unknown[] = []
    const result = await runTranslateAllLabels({
      survey,
      generateText,
      guard: noGuard,
      onProgress: (value) => progress.push(value),
      translate: async (params: any) => {
        calls.push({ size: params.items.length, targetLangs: params.targetLangs })
        expect(params.sourceLang).toBe('en')
        return translateAll(params)
      },
    })
    expect(calls).toEqual([
      { size: 20, targetLangs: ['fr', 'es'] },
      { size: 20, targetLangs: ['fr', 'es'] },
      { size: 5, targetLangs: ['fr', 'es'] },
    ])
    expect(progress.at(-1)).toEqual({ done: 3, total: 3 })
    expect(result.failedCount).toBe(0)
  })

  test('more than 20 other languages are split into groups of 20 per call', async () => {
    const otherLangs = Array.from({ length: 22 }, (_v, i) => `l${i}`)
    const survey = await buildWideSurvey(3, ['en', ...otherLangs])
    const groups: string[][] = []
    const result = await runTranslateAllLabels({
      survey,
      generateText,
      guard: noGuard,
      translate: async (params: any) => {
        groups.push(params.targetLangs)
        return translateAll(params)
      },
    })
    expect(groups).toEqual([otherLangs.slice(0, 20), otherLangs.slice(20)])
    const item = result.items.find((resultItem) => resultItem.nodeDefUuid === uuidOf(survey, 'a_0'))!
    expect(Object.keys(item.aiLabelsByLang)).toEqual(otherLangs)
  })

  test('the result has the shape of the old job result, plus the failed count', async () => {
    const survey = await SB.survey(
      user,
      SB.entity(
        'cluster',
        SB.attribute('cluster_id')
          .label('Id')
          .label('Identifiant', 'fr')
          .prop(NodeDef.propKeys.descriptions, { en: 'The id' }),
        SB.attribute('notes').label('Notes')
      ).label('Cluster')
    )
      .languages('en', 'fr')
      .build()
    const result = await runTranslateAllLabels({ survey, generateText, guard: noGuard, translate: translateAll })
    expect(result).toEqual({
      defaultLang: 'en',
      languages: ['en', 'fr'],
      otherLangs: ['fr'],
      failedCount: 0,
      items: [
        {
          nodeDefUuid: uuidOf(survey, 'cluster'),
          path: 'cluster',
          defaultLangLabel: 'Cluster',
          defaultLangDescription: '',
          existingLabelsByLang: { fr: '' },
          existingDescriptionsByLang: { fr: '' },
          aiLabelsByLang: { fr: 'fr:Cluster' },
          aiDescriptionsByLang: {},
        },
        {
          nodeDefUuid: uuidOf(survey, 'cluster_id'),
          path: 'cluster / cluster_id',
          defaultLangLabel: 'Id',
          defaultLangDescription: 'The id',
          existingLabelsByLang: { fr: 'Identifiant' },
          existingDescriptionsByLang: { fr: '' },
          aiLabelsByLang: { fr: 'fr:Id' },
          aiDescriptionsByLang: { fr: 'fr:The id' },
        },
        {
          nodeDefUuid: uuidOf(survey, 'notes'),
          path: 'cluster / notes',
          defaultLangLabel: 'Notes',
          defaultLangDescription: '',
          existingLabelsByLang: { fr: '' },
          existingDescriptionsByLang: { fr: '' },
          aiLabelsByLang: { fr: 'fr:Notes' },
          aiDescriptionsByLang: {},
        },
      ],
    })
  })

  test('a failed call is counted (items × languages) and the others still apply', async () => {
    const survey = await buildWideSurvey(25, ['en', 'fr', 'es'])
    let call = 0
    const result = await runTranslateAllLabels({
      survey,
      generateText,
      guard: noGuard,
      translate: async (params: any) => {
        call += 1
        if (call === 1) throw new SystemError('aiTranslationInvalid', {}, 502)
        return translateAll(params)
      },
    })
    expect(result.failedCount).toBe(20 * 2)
    const translated = result.items.filter((item) => Object.keys(item.aiLabelsByLang).length > 0)
    expect(translated).toHaveLength(5)
  })

  test('translations the model drops are counted: missing, partial, foreign language, foreign id and blank', async () => {
    const survey = await buildWideSurvey(3, ['en', 'fr', 'es']) // 4 texts (root has no label: 3) x 2 languages
    const uuids = ['a_0', 'a_1', 'a_2'].map((name) => uuidOf(survey, name))
    const result = await runTranslateAllLabels({
      survey,
      generateText,
      guard: noGuard,
      translate: async () => ({
        translations: [
          { id: `${uuids[0]}_label`, byLang: { fr: 'ok fr', es: 'ok es' } }, // complete
          { id: `${uuids[1]}_label`, byLang: { fr: 'seulement', de: 'Fremdsprache' } }, // es missing, de foreign
          { id: `${uuids[2]}_label`, byLang: { fr: '  ', es: '' } }, // blank values
          { id: 'unknown_id', byLang: { fr: 'x', es: 'y' } }, // foreign id
        ],
      }),
    })
    // 3 texts x 2 languages = 6 asked, 3 kept (a_0 fr+es, a_1 fr)
    expect(result.failedCount).toBe(3)
    const byName = (name: string) => result.items.find((item) => item.nodeDefUuid === uuidOf(survey, name))!
    expect(byName('a_0').aiLabelsByLang).toEqual({ fr: 'ok fr', es: 'ok es' })
    expect(byName('a_1').aiLabelsByLang).toEqual({ fr: 'seulement' })
    expect(byName('a_2').aiLabelsByLang).toEqual({})
  })

  test('a model that answers with no translation counts every text x language as failed', async () => {
    const survey = await buildWideSurvey(2, ['en', 'fr'])
    const result = await runTranslateAllLabels({
      survey,
      generateText,
      guard: noGuard,
      translate: async () => ({ translations: [] }),
    })
    expect(result.failedCount).toBe(2)
  })

  test('the workflow with nothing to translate resolves no model', async () => {
    const survey = await buildWideSurvey(0, ['en', 'fr'])
    const { translateAllLabelsWorkflow } = await import('@webapp/ai/workflows/translateAllLabels')
    const result = await translateAllLabelsWorkflow({ survey, surveyId: 1 })
    expect(result.failedCount).toBe(0)
    expect(result.items.length).toBeGreaterThan(0)
  })

  test('cancel during a call: no result and no further call', async () => {
    const survey = await buildWideSurvey(45, ['en', 'fr'])
    const controller = new AbortController()
    let calls = 0
    const error = await runTranslateAllLabels({
      survey,
      generateText,
      guard: noGuard,
      signal: controller.signal,
      translate: async () => {
        calls += 1
        controller.abort()
        throw new DOMException('The request was aborted.', 'AbortError')
      },
    }).catch((caught) => caught)
    expect(isAiAbortError(error)).toBe(true)
    expect(calls).toBe(1)
  })

  test('a survey with one language makes no call', async () => {
    const survey = await buildWideSurvey(3, ['en'])
    let calls = 0
    const result = await runTranslateAllLabels({
      survey,
      generateText,
      guard: noGuard,
      translate: async (params: any) => {
        calls += 1
        return translateAll(params)
      },
    })
    expect(calls).toBe(0)
    expect(result.otherLangs).toEqual([])
    expect(result.failedCount).toBe(0)
  })
})
