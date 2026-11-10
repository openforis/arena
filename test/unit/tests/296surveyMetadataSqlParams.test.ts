import pgPromise from 'pg-promise'

import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import { ExtraPropDef } from '@core/survey/extraPropDef'
import * as SurveyValidator from '@core/survey/surveyValidator'
import { validateCycles } from '@core/survey/_surveyValidator/surveyCyclesValidator'
import * as Validation from '@core/validation/validation'

import { generateCategoryExportStream } from '@server/modules/category/repository/categoryExportRepository'
import { fetchTaxaWithVernacularNamesStream } from '@server/modules/taxonomy/repository/taxonomyRepository'
import * as NodeDefRepository from '@server/modules/nodeDef/repository/nodeDefRepository'

const pgp = pgPromise()

// stored values containing quotes: they must end up in the SQL only as escaped literals or quoted identifiers
const langWithQuote = "x'y"
const cycleWithQuote = "2'"

const getErrorKeys = (validation: any): string[] =>
  (Validation.getErrors(validation) as { key: string }[]).map((error) => error.key)

describe('Survey metadata passed to SQL as parameters', () => {
  test('category export: language codes, level and extra prop names are escaped, aliases are quoted', () => {
    let category = Category.newCategory({
      [Category.keysProps.name]: 'regions',
      [Category.keysProps.itemExtraDef]: { area: ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.text }) },
    })
    category = Category.assocLevelsArray([
      Category.newLevel(category, { name: 'region' }, 0),
      Category.newLevel(category, { name: 'district' }, 1),
    ])(category)

    const { cursor } = generateCategoryExportStream({ surveyId: 1, category, languages: ['en', langWithQuote] }) as any
    const sql: string = cursor.text

    expect(sql).toContain(`AS "region_code"`)
    expect(sql).toContain(`AS "district_code"`)
    expect(sql).toContain(`->> 'en' AS "label_en"`)
    expect(sql).toContain(`->> 'x''y' AS "label_x'y"`)
    expect(sql).toContain(`->> 'x''y' AS "description_x'y"`)
    expect(sql).toContain(`->> 'area' AS "area"`)
    expect(sql).toContain(`WHERE l.category_uuid = '${Category.getUuid(category)}'`)
  })

  test('taxa export: vernacular language codes and extra prop names are escaped, aliases are quoted', () => {
    const { cursor } = fetchTaxaWithVernacularNamesStream({
      surveyId: 1,
      taxonomyUuid: 'taxonomy-uuid',
      vernacularLangCodes: ['eng', langWithQuote],
      extraPropsDefs: { status: {} },
    }) as any
    const sql: string = cursor.text

    expect(sql).toContain(`= 'eng'`)
    expect(sql).toContain(`AS "eng"`)
    expect(sql).toContain(`= 'x''y'`)
    expect(sql).toContain(`AS "x'y"`)
    expect(sql).toContain(`#>>array['extra','status']::text[] AS "status"`)
    expect(sql).toContain(`t.taxonomy_uuid = 'taxonomy-uuid'`)
  })

  test('node defs: cycle keys and deleted languages are escaped', async () => {
    const queries: string[] = []
    const format = (query: string, values?: unknown) => {
      queries.push(pgp.as.format(query, values))
      return Promise.resolve()
    }
    const client: any = { query: format, none: format }

    await NodeDefRepository.deleteNodeDefsCycles(1, ['1', cycleWithQuote], client)
    await NodeDefRepository.deleteNodeDefsLabels(1, langWithQuote, client)
    await NodeDefRepository.deleteNodeDefsValidationMessageLabels(1, ['fr', langWithQuote], client)

    const sql = queries.join('\n')
    expect(sql).toContain(`- array['1','2''']::text[]`)
    expect(sql).toContain(`#- array['labels','x''y']::text[]`)
    expect(sql).toContain(`#- array['messages','fr']::text[] #- array['messages','x''y']::text[]`)
  })
})

describe('Survey info validation', () => {
  const newSurveyInfo = (props: Record<string, unknown>) =>
    Survey.newSurvey({ ownerUuid: 'owner-uuid', name: 'survey_test', languages: ['en'], ...props })

  test('known language codes are valid', async () => {
    const validation = await SurveyValidator.validateSurveyInfo(newSurveyInfo({ languages: ['en', 'fr'] }))
    expect(Validation.isValid(validation)).toBe(true)
  })

  test('unknown language codes are not valid', async () => {
    const validation = await SurveyValidator.validateSurveyInfo(newSurveyInfo({ languages: ['en', langWithQuote] }))
    const languagesValidation = Validation.getFieldValidation(Survey.infoKeys.languages)(validation)
    expect(getErrorKeys(languagesValidation)).toEqual([Validation.messageKeys.surveyInfoEdit.langInvalid])
    expect(SurveyValidator.getInvalidLanguageCodes(['en', langWithQuote, 'eng'])).toEqual([langWithQuote, 'eng'])
  })

  test('the language of a new survey must be a known code', async () => {
    const validation = await SurveyValidator.validateNewSurvey({
      newSurvey: { name: 'survey_test', lang: 'eng' },
      surveyInfos: null,
    })
    const langValidation = Validation.getFieldValidation('lang')(validation)
    expect(getErrorKeys(langValidation)).toEqual([Validation.messageKeys.surveyInfoEdit.langInvalid])
  })

  const cycle0 = { dateStart: '2020-01-01', dateEnd: '2020-12-31' }
  const cycle1 = { dateStart: '2021-01-01' }

  test('cycle keys "0", "1"... are valid', async () => {
    expect(Validation.isValid(await validateCycles({ 0: cycle0, 1: cycle1 }))).toBe(true)
  })

  test.each([[{ 0: cycle0, 2: cycle1 }], [{ 1: cycle0 }], [{ 0: cycle0, [cycleWithQuote]: cycle1 }]])(
    'cycle keys %j are not valid',
    async (cycles) => {
      const validation = await validateCycles(cycles)
      expect(getErrorKeys(validation)).toEqual([Validation.messageKeys.surveyInfoEdit.cycleKeysInvalid])
      expect(SurveyValidator.areCycleKeysValid(cycles)).toBe(false)
    }
  )
})
