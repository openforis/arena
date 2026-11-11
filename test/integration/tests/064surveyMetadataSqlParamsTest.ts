import { Writable } from 'node:stream'
import { parse } from '@fast-csv/parse'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as Category from '@core/survey/category'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Taxonomy from '@core/survey/taxonomy'
import { ExtraPropDef } from '@core/survey/extraPropDef'
import * as ObjectUtils from '@core/objectUtils'
import * as Validation from '@core/validation/validation'
import { FileFormats } from '@core/fileFormats'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as NodeDefRepository from '@server/modules/nodeDef/repository/nodeDefRepository'
import * as CategoryManager from '@server/modules/category/manager/categoryManager'
import * as TaxonomyManager from '@server/modules/taxonomy/manager/taxonomyManager'
import * as TaxonomyService from '@server/modules/taxonomy/service/taxonomyService'

import { getContextUser } from '../config/context'

import * as SB from '../../utils/surveyBuilder'
import * as SurveyUtils from '../../utils/surveyUtils'

// Language codes, cycle keys, level and extra prop names are passed to the queries as parameters:
// exports must keep the same headers, cycles and deleted languages must still be updated.

const categoryName = 'regions'
const taxonomyName = 'trees'

let survey: any = null
let surveyId: number = null
let categoryUuid: string = null
let taxonomyUuid: string = null

const exportToCsv = async (exportFn: (outputStream: Writable) => Promise<unknown>) => {
  const chunks: Buffer[] = []
  const outputStream = new Writable({
    write(chunk, _encoding, callback) {
      chunks.push(Buffer.from(chunk))
      callback()
    },
  })
  await exportFn(outputStream)
  const text = Buffer.concat(chunks).toString('utf8')
  return new Promise<{ headers: string[]; rows: Record<string, string>[] }>((resolve, reject) => {
    let headers: string[] = []
    const rows: Record<string, string>[] = []
    const parser = parse({ headers: true })
      .on('headers', (headersRead: string[]) => (headers = headersRead))
      .on('data', (row: Record<string, string>) => rows.push(row))
      .on('error', reject)
      .on('end', () => resolve({ headers, rows }))
    parser.write(text)
    parser.end()
  })
}

const fetchDraftSurveyProps = async () => {
  const surveyDraft = await SurveyManager.fetchSurveyById({ surveyId, draft: true })
  return ObjectUtils.getProps(Survey.getSurveyInfo(surveyDraft))
}

const fetchNodeDefsDraft = () => NodeDefRepository.fetchNodeDefsBySurveyId({ surveyId, cycle: null, draft: true })

describe('Survey metadata passed to SQL queries as parameters', () => {
  beforeAll(async () => {
    const user = getContextUser()

    const categoryBuilder = SB.category(categoryName)
      .levels('region', 'district')
      .extraProps({ area_ha: ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.text }) })
      .items(
        SB.categoryItem('R1')
          .label('Region 1')
          .extra({ area_ha: '10' })
          .items(SB.categoryItem('D1').label('District 1').extra({ area_ha: '5' }))
      )

    const taxonomyBuilder = SB.taxonomy(taxonomyName)
      .extraProps({ status: ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.text }) })
      .taxa(
        SB.taxon('AFZ', 'Fabaceae', 'Afzelia', 'Afzelia quanzensis')
          .vernacularName('swa', 'Mkongo')
          .extra('status', 'native')
      )

    survey = await SB.survey(
      user,
      SB.entity(
        'plot',
        SB.attribute('plot_no', NodeDef.nodeDefType.integer)
          .key()
          .label('Plot number', 'en')
          .label('Numéro de placette', 'fr')
          .expressions(
            NodeDefExpression.createExpression({
              expression: 'plot_no > 0',
              messages: { en: 'Must be positive', fr: 'Doit être positif' },
            })
          )
      )
    )
      .props({
        languages: ['en', 'fr'],
        labels: { en: 'Test survey', fr: 'Formulaire de test' },
        descriptions: { en: 'Description', fr: 'Description FR' },
      })
      .categories(categoryBuilder)
      .taxonomies(taxonomyBuilder)
      .buildAndStore()

    surveyId = Survey.getId(survey)
    categoryUuid = Category.getUuid(categoryBuilder.build().category)
    taxonomyUuid = Taxonomy.getUuid(taxonomyBuilder.build().taxonomy)

    await TaxonomyManager.updateTaxonomyProp(user, surveyId, taxonomyUuid, Taxonomy.keysProps.vernacularLanguageCodes, [
      'swa',
    ])
  })

  afterAll(async () => {
    if (surveyId) {
      await SurveyManager.deleteSurvey(surveyId)
    }
  })

  test('category export keeps the level, label and extra prop column names', async () => {
    const surveyDraft = await SurveyManager.fetchSurveyById({ surveyId, draft: true })
    const { headers, rows } = await exportToCsv((outputStream) =>
      CategoryManager.exportCategoryToStream({
        survey: surveyDraft,
        categoryUuid,
        outputStream,
        fileFormat: FileFormats.csv,
      })
    )
    expect(headers).toEqual([
      'region_code',
      'district_code',
      'label_en',
      'label_fr',
      'description_en',
      'description_fr',
      'area_ha',
    ])
    expect(rows).toHaveLength(2)
    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ region_code: 'R1', district_code: '', label_en: 'Region 1', area_ha: '10' }),
        expect.objectContaining({ region_code: 'R1', district_code: 'D1', label_en: 'District 1', area_ha: '5' }),
      ])
    )
  })

  test('taxa export keeps the vernacular language and extra prop column names', async () => {
    const { headers, rows } = await exportToCsv((outputStream) =>
      TaxonomyService.exportTaxa({ surveyId, taxonomyUuid, outputStream, fileFormat: FileFormats.csv, draft: true })
    )
    expect(headers).toEqual(['code', 'family', 'genus', 'scientific_name', 'swa', 'status'])
    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'AFZ',
          scientific_name: 'Afzelia quanzensis',
          swa: 'Mkongo',
          status: 'native',
        }),
      ])
    )
  })

  test('invalid level and extra prop names and vernacular language codes are not saved', async () => {
    const user = getContextUser()
    const textExtraDef = ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.text })
    const newCategory = ({ levelName = 'region', extraName = 'area' } = {}) => {
      const category = Category.newCategory({
        [Category.keysProps.name]: 'invalid_names',
        [Category.keysProps.itemExtraDef]: { [extraName]: textExtraDef },
      })
      return Category.assocLevelsArray([Category.newLevel(category, { name: levelName }, 0)])(category)
    }
    const nameInvalidKey = Validation.messageKeys.nameInvalid

    await expect(
      CategoryManager.insertCategory({ user, surveyId, category: newCategory({ levelName: 'Region' }) })
    ).rejects.toThrow(nameInvalidKey)
    await expect(
      CategoryManager.insertCategory({ user, surveyId, category: newCategory({ extraName: 'area 2020' }) })
    ).rejects.toThrow(nameInvalidKey)
    await expect(
      TaxonomyManager.insertTaxonomy({
        user,
        surveyId,
        taxonomy: Taxonomy.newTaxonomy({
          [Taxonomy.keysProps.name]: 'invalid_langs',
          [Taxonomy.keysProps.vernacularLanguageCodes]: ['swa', 'en'],
        }),
      })
    ).rejects.toThrow('survey.languageCodeInvalid')
    await expect(
      TaxonomyManager.updateTaxonomyProp(user, surveyId, taxonomyUuid, Taxonomy.keysProps.extraPropsDefs, {
        status: textExtraDef,
        'max height': textExtraDef,
      })
    ).rejects.toThrow(nameInvalidKey)

    const categories = await CategoryManager.fetchCategoriesAndLevelsBySurveyId({ surveyId, draft: true })
    expect(Object.values(categories).map(Category.getName)).toEqual([categoryName])
    const taxonomies = await TaxonomyManager.fetchTaxonomiesBySurveyId({ surveyId, draft: true })
    expect(taxonomies.map(Taxonomy.getName)).toEqual([taxonomyName])
    const taxonomy = taxonomies[0]
    expect(Object.keys(Taxonomy.getExtraPropsDefs(taxonomy))).toEqual(['status'])
  })

  test('adding and removing a cycle updates the node defs cycles and layouts', async () => {
    const user = getContextUser()
    const props = await fetchDraftSurveyProps()
    const cycle0 = { dateStart: '2020-01-01', dateEnd: '2020-12-31' }

    const surveyInvalid = await SurveyManager.updateSurveyProps(user, surveyId, {
      ...props,
      cycles: { 0: cycle0, "1'": { dateStart: '2021-01-01' } },
    })
    expect(Survey.getId(Survey.getSurveyInfo(surveyInvalid))).toBeFalsy()

    await SurveyManager.updateSurveyProps(user, surveyId, {
      ...props,
      cycles: { 0: cycle0, 1: { dateStart: '2021-01-01' } },
    })
    let nodeDefs = await fetchNodeDefsDraft()
    for (const nodeDef of nodeDefs) {
      expect(NodeDef.getCycles(nodeDef)).toEqual(['0', '1'])
    }
    const rootDef = nodeDefs.find((nodeDef) => NodeDef.isRoot(nodeDef))
    expect(NodeDefLayout.getLayoutCycle('1')(rootDef)).toEqual(NodeDefLayout.getLayoutCycle('0')(rootDef))

    await SurveyManager.updateSurveyProps(user, surveyId, { ...props, cycles: { 0: { dateStart: '2020-01-01' } } })
    nodeDefs = await fetchNodeDefsDraft()
    for (const nodeDef of nodeDefs) {
      expect(NodeDef.getCycles(nodeDef)).toEqual(['0'])
    }
    expect(NodeDefLayout.getLayoutCycle('1')(nodeDefs.find((nodeDef) => NodeDef.isRoot(nodeDef)))).toBeUndefined()
  })

  test('publishing after removing a language deletes its labels, descriptions and messages', async () => {
    const user = getContextUser()
    const items = await CategoryManager.fetchItemsByCategoryUuid({ surveyId, categoryUuid, draft: true })
    const itemR1 = items.find((item: any) => CategoryItem.getCode(item) === 'R1')
    await CategoryManager.updateItemProp(
      user,
      surveyId,
      categoryUuid,
      CategoryItem.getUuid(itemR1),
      CategoryItem.keysProps.labels,
      { en: 'Region 1', fr: 'Région 1' }
    )

    const props = await fetchDraftSurveyProps()
    const surveyInvalid = await SurveyManager.updateSurveyProps(user, surveyId, { ...props, languages: ['en', "x'y"] })
    expect(Survey.getId(Survey.getSurveyInfo(surveyInvalid))).toBeFalsy()

    await SurveyManager.updateSurveyProps(user, surveyId, { ...props, languages: ['en'] })
    await SurveyUtils.publishSurvey(user, surveyId)

    const surveyPublished = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({
      surveyId,
      draft: false,
      advanced: true,
    })
    const surveyInfo = Survey.getSurveyInfo(surveyPublished)
    expect(Survey.getLabels(surveyInfo)).toEqual({ en: 'Test survey' })
    expect(Survey.getDescriptions(surveyInfo)).toEqual({ en: 'Description' })

    const plotNoDef = Survey.getNodeDefByName('plot_no')(surveyPublished)
    expect(NodeDef.getLabels(plotNoDef)).toEqual({ en: 'Plot number' })
    const [expression] = NodeDefValidations.getExpressions(NodeDef.getValidations(plotNoDef))
    expect(NodeDefExpression.getMessages(expression)).toEqual({ en: 'Must be positive' })

    const itemsPublished = await CategoryManager.fetchItemsByCategoryUuid({ surveyId, categoryUuid, draft: false })
    const itemR1Published = itemsPublished.find((item: any) => CategoryItem.getCode(item) === 'R1')
    expect(CategoryItem.getLabels(itemR1Published)).toEqual({ en: 'Region 1' })
  })
})
