import path from 'path'
import fs from 'fs'
import { client, toLeftOf } from 'taiko'
import extract from 'extract-zip'
import csvParseSync from 'csv-parse/lib/sync'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Taxonomy from '@core/survey/taxonomy'
import * as Taxon from '@core/survey/taxon'
import * as TaxonVernacularName from '@core/survey/taxonVernacularName'

import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'
import * as Calculation from '@common/analysis/processingStepCalculation'

import { waitFor, reload, click } from '../utils/api'

import { expectHomeDashboard } from '../utils/ui/home'
import { clickSidebarBtnHome } from '../utils/ui/sidebar'

const downloadPath = path.resolve(__dirname, 'data', 'downloaded')
const surveyZipPath = path.join(downloadPath, 'survey_survey.zip')
const extractedPath = path.resolve(downloadPath, 'extracted')
const surveyExtractedPath = path.join(extractedPath, 'survey_survey')

const includeAnalysis = true
const ClusterNodeDefItems = [
  { type: 'integer', name: 'cluster_id', label: 'Cluster id', isKey: true },
  { type: 'decimal', name: 'cluster_decimal', label: 'Cluster decimal' }, // propsAdvanced.defaultValues, expression "0", apply if null
  { type: 'date', name: 'cluster_date', label: 'Cluster date' }, // "applyIf": "", "expression": "cluster_decimal > '0'\n"
  { type: 'time', name: 'cluster_time', label: 'Cluster Time' },
  { type: 'boolean', name: 'cluster_boolean', label: 'Cluster boolean' }, //"applyIf": "cluster_decimal > '5'\n", "expression": "\"true\""
  { type: 'coordinate', name: 'cluster_coordinate', label: 'Cluster coordinate' },
  { type: 'entity', name: 'plot', label: 'Plot' },
]

const PlotNodeDefItems = [
  { type: NodeDef.nodeDefType.integer, name: 'plot_id', label: 'Plot id', isKey: true },
  { type: NodeDef.nodeDefType.text, name: 'plot_text', label: 'Plot text', isKey: false },
  { type: NodeDef.nodeDefType.file, name: 'plot_file', label: 'Plot file', isKey: false },
  { type: NodeDef.nodeDefType.entity, name: 'tree', label: 'Tree', isKey: false }, // "multiple":true,"renderType":"table"
  { type: NodeDef.nodeDefType.code, name: 'country', label: 'Country', isKey: false },
  { type: NodeDef.nodeDefType.code, name: 'region', label: 'Region', isKey: false },
  { type: NodeDef.nodeDefType.code, name: 'province', label: 'Province', isKey: false },
]

const TreeNodeDefItems = [
  { type: 'integer', name: 'tree_id', label: 'Tree id', isKey: true },
  { type: 'decimal', name: 'tree_dec_1', label: 'Tree decimal 1', isKey: false },
  { type: 'decimal', name: 'tree_dec_2', label: 'Tree decimal 2', isKey: false },
  { type: 'taxon', name: 'tree_species', label: 'Tree Species', isKey: false },
  {
    type: 'decimal',
    name: 'tree_volume',
    label: 'Tree volume label (C)',
    isKey: false,
    isAnalysis: true,
    descriptions: 'Tree volume description',
  },
]

const checkNode = async ({ node, expectedNode }) => {
  await expect(NodeDef.getName(node)).toBe(expectedNode.name)
  await expect(NodeDef.getLabel(node, 'en')).toBe(expectedNode.label)
  await expect(NodeDef.getType(node)).toBe(expectedNode.type)
  await expect(NodeDef.isKey(node)).toBe(expectedNode.isKey || false)
  await expect(NodeDef.isAnalysis(node)).toBe(expectedNode.isAnalysis || false)
}

describe('Survey export', () => {
  test('Survey require name', async () => {
    await reload()
    await waitFor(5000)

    await client().send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath,
    })

    await clickSidebarBtnHome()
    await expectHomeDashboard({ label: 'Survey' })

    await click('Export', toLeftOf('Delete'))
    await waitFor(10000)
    await expect(path.join(downloadPath, 'survey_survey.zip')).toBeTruthy()
    await expect(fs.existsSync(surveyZipPath)).toBeTruthy()
  }, 150000)

  test('Unzip file', async () => {
    await extract(surveyZipPath, { dir: extractedPath })
    await expect(fs.existsSync(extractedPath)).toBeTruthy()
    await expect(fs.existsSync(surveyExtractedPath)).toBeTruthy()
  })

  test('Check survey.json', async () => {
    await expect(fs.existsSync(path.join(surveyExtractedPath, 'survey.json'))).toBeTruthy()
    const content = fs.readFileSync(path.join(surveyExtractedPath, 'survey.json'), 'utf8')
    const survey = JSON.parse(content)
    const surveyInfo = Survey.getSurveyInfo(survey)
    const surveyName = Survey.getName(surveyInfo)
    await expect(surveyName).toBe('survey')
    const labels = Survey.getLabels(surveyInfo)
    await expect(labels).toMatchObject({
      en: 'Survey',
    })
    const languages = Survey.getLanguages(surveyInfo)
    await expect(languages.sort()).toEqual(['en', 'fr'].sort())
  })

  test('Check survey.json nodeDefs', async () => {
    const content = fs.readFileSync(path.join(surveyExtractedPath, 'survey.json'), 'utf8')
    const survey = JSON.parse(content)

    const root = Survey.getNodeDefRoot(survey)

    // Check cluster
    await expect(NodeDef.isRoot(root)).toBe(true)
    await expect(NodeDef.getName(root)).toBe('cluster')
    await expect(NodeDef.getLabel(root, 'en')).toBe('Cluster')

    const clusterDefChildren = Survey.getNodeDefChildren(root, includeAnalysis)(survey)

    await clusterDefChildren.reduce(async (promise, item, index) => {
      await promise
      return checkNode({ node: item, expectedNode: ClusterNodeDefItems[index] })
    }, true)

    // Check plot
    const plotNodeDef = clusterDefChildren.find(
      (nodeDef) => NodeDef.isMultiple(nodeDef) && NodeDef.getName(nodeDef) === 'plot'
    )

    await expect(plotNodeDef).toBeTruthy()

    const plotNodeDefChildren = Survey.getNodeDefChildren(plotNodeDef, includeAnalysis)(survey)

    await plotNodeDefChildren.reduce(async (promise, item, index) => {
      await promise
      return checkNode({ node: item, expectedNode: PlotNodeDefItems[index] })
    }, true)

    // Check Country - Region - Province hierarchy
    const countryNode = plotNodeDefChildren.find((node) => NodeDef.getName(node) === 'country')
    const regionNode = plotNodeDefChildren.find((node) => NodeDef.getName(node) === 'region')
    const provinceNode = plotNodeDefChildren.find((node) => NodeDef.getName(node) === 'province')

    await expect(NodeDef.getParentCodeDefUuid(provinceNode)).toBe(NodeDef.getUuid(regionNode))
    await expect(NodeDef.getParentCodeDefUuid(regionNode)).toBe(NodeDef.getUuid(countryNode))
    await expect(NodeDef.getParentCodeDefUuid(countryNode)).toBe(null)

    await expect(NodeDef.getCategoryUuid(countryNode)).toBeTruthy()
    await expect(NodeDef.getCategoryUuid(countryNode)).toBe(NodeDef.getCategoryUuid(regionNode))
    await expect(NodeDef.getCategoryUuid(regionNode)).toBe(NodeDef.getCategoryUuid(provinceNode))

    // Check tree
    const treeNodeDef = plotNodeDefChildren.find((node) => NodeDef.getName(node) === 'tree')
    await expect(treeNodeDef).toBeTruthy()
    const treeNodeDefChildren = Survey.getNodeDefChildren(treeNodeDef, includeAnalysis)(survey)

    await treeNodeDefChildren.reduce(async (promise, item, index) => {
      await promise
      return checkNode({ node: item, expectedNode: TreeNodeDefItems[index] })
    }, true)
  })

  test('Check categories', async () => {
    await expect(fs.existsSync(path.join(surveyExtractedPath, 'categories'))).toBeTruthy()

    const content = fs.readFileSync(path.join(surveyExtractedPath, 'categories', 'categories.json'), 'utf8')
    const categories = JSON.parse(content)
    const categoriesAsArray = Object.values(categories)

    await expect(categoriesAsArray.length).toBe(1)

    const administrativeUnitCategory = categoriesAsArray.find(
      (category) => Category.getName(category) === 'administrative_unit'
    )

    const administrativeUnitUuid = Category.getUuid(administrativeUnitCategory)

    await expect(
      fs.existsSync(path.join(surveyExtractedPath, 'categories', `${administrativeUnitUuid}.json`))
    ).toBeTruthy()

    const levels = Category.getLevelsArray(administrativeUnitCategory)

    await expect(levels.length).toBe(3)
    await expect(Category.getLevelsCount(administrativeUnitCategory)).toBe(3)

    // check countryLevel
    const countryLevel = levels.find((category) => CategoryLevel.getName(category) === 'country')
    await expect(countryLevel).toBeTruthy()
    await expect(CategoryLevel.getName(countryLevel)).toBe('country')
    await expect(CategoryLevel.getIndex(countryLevel)).toBe(0)
    const countryLevelUuid = CategoryLevel.getUuid(countryLevel)

    // check regionLevel
    const regionLevel = levels.find((category) => CategoryLevel.getName(category) === 'region')
    await expect(regionLevel).toBeTruthy()
    await expect(CategoryLevel.getName(regionLevel)).toBe('region')
    await expect(CategoryLevel.getIndex(regionLevel)).toBe(1)
    const regionLevelUuid = CategoryLevel.getUuid(regionLevel)

    // check districtLevel
    const districtLevel = levels.find((category) => CategoryLevel.getName(category) === 'district')
    await expect(districtLevel).toBeTruthy()
    await expect(CategoryLevel.getName(districtLevel)).toBe('district')
    await expect(CategoryLevel.getIndex(districtLevel)).toBe(2)
    const districtLevelUuid = CategoryLevel.getUuid(districtLevel)

    // check administrative unit file
    const administrativeUnitContent = fs.readFileSync(
      path.join(surveyExtractedPath, 'categories', `${administrativeUnitUuid}.json`),
      'utf8'
    )
    const administrativeUnitItems = JSON.parse(administrativeUnitContent)

    // check items countryLevel
    const itemsCountryLevel = administrativeUnitItems.filter(
      (item) => CategoryItem.getLevelUuid(item) === CategoryLevel.getUuid(countryLevel)
    )
    await expect(itemsCountryLevel.length).toBe(1)

    await itemsCountryLevel.reduce(async (promise, item) => {
      await promise
      return (async () => {
        await expect(CategoryItem.getParentUuid(item)).toBe(null)
        await expect(CategoryItem.getCode(item)).toBe('00')
        await expect(CategoryItem.getLabel('en')(item)).toBe('Country')
      })()
    }, true)

    // check items itemsRegionLevel
    const itemsRegionLevel = administrativeUnitItems.filter(
      (item) => CategoryItem.getLevelUuid(item) === CategoryLevel.getUuid(regionLevel)
    )
    await expect(itemsRegionLevel.length).toBe(5)

    await itemsRegionLevel.reduce(async (promise, item, index) => {
      await promise
      return (async () => {
        await expect(CategoryItem.getParentUuid(item)).toBe(CategoryItem.getUuid(itemsCountryLevel[0]))
        await expect(CategoryItem.getLevelUuid(item)).toBe(CategoryLevel.getUuid(regionLevel))
        const code = `0${index + 1}`
        await expect(CategoryItem.getCode(item)).toBe(`${code}`)
        await expect(CategoryItem.getLabel('en')(item)).toBe(`Region ${code}`)
      })()
    }, true)

    // check items itemsDistrictLevel
    const itemsDistrictLevel = administrativeUnitItems.filter(
      (item) => CategoryItem.getLevelUuid(item) === CategoryLevel.getUuid(districtLevel)
    )
    await expect(itemsDistrictLevel.length).toBe(25)

    await itemsDistrictLevel.reduce(async (promise, item, index) => {
      await promise
      return (async () => {
        await expect(CategoryItem.getParentUuid(item)).toBe(
          CategoryItem.getUuid(itemsRegionLevel[Math.floor(index / 5)])
        )
        await expect(CategoryItem.getLevelUuid(item)).toBe(CategoryLevel.getUuid(districtLevel))
        const code = `0${Math.floor(index / 5) + 1}0${(index % 5) + 1}`
        await expect(CategoryItem.getCode(item)).toBe(code)
        await expect(CategoryItem.getLabel('en')(item)).toBe(`District ${code}`)
      })()
    }, true)
  })

  test('Check chains', async () => {
    await expect(fs.existsSync(path.join(surveyExtractedPath, 'chains'))).toBeTruthy()
    const content = fs.readFileSync(path.join(surveyExtractedPath, 'chains', 'chains.json'), 'utf8')
    const chains = JSON.parse(content)

    const chainsAsArray = Object.values(chains)

    await expect(chainsAsArray.length).toBe(1)

    const chainUuid = Chain.getUuid(chainsAsArray[0])
    await expect(Chain.getLabel('en')(chainsAsArray[0])).toBe('Chain 1')
    await expect(Chain.getDescription('en')(chainsAsArray[0])).toBe('Processing description')

    await expect(fs.existsSync(path.join(surveyExtractedPath, 'chains', `${chainUuid}.json`))).toBeTruthy()

    const chainContent = fs.readFileSync(path.join(surveyExtractedPath, 'chains', `${chainUuid}.json`), 'utf8')
    const chain = JSON.parse(chainContent)

    await expect(Chain.getLabel('en')(chain)).toBe('Chain 1')
    await expect(Chain.getDescription('en')(chain)).toBe('Processing description')

    const processingSteps = Chain.getProcessingSteps(chain)
    await expect(processingSteps.length).toBe(1)

    await expect(Step.getProcessingChainUuid(processingSteps[0])).toBe(chainUuid)
    const calculations = Step.getCalculations(processingSteps[0])
    await expect(calculations.length).toBe(1)
    const calculation = calculations[0]
    await expect(Calculation.getProcessingStepUuid(calculation)).toBe(Step.getUuid(processingSteps[0]))
    await expect(Calculation.getLabel('en')(calculation)).toBe('Tree volume')
  })

  test('Check taxonomies', async () => {
    await expect(fs.existsSync(path.join(surveyExtractedPath, 'taxonomies'))).toBeTruthy()
    const content = fs.readFileSync(path.join(surveyExtractedPath, 'taxonomies', 'taxonomies.json'), 'utf8')
    const taxonomies = JSON.parse(content)
    const taxonomiesAsArray = Object.values(taxonomies)

    await expect(taxonomiesAsArray.length).toBe(1)

    const taxonomyUuid = Chain.getUuid(taxonomiesAsArray[0])
    await expect(Taxonomy.getName(taxonomiesAsArray[0])).toBe('tree_species')
    await expect(Taxonomy.getDescription('en')(taxonomiesAsArray[0])).toBe('Tree Species List')

    await expect(fs.existsSync(path.join(surveyExtractedPath, 'taxonomies', `${taxonomyUuid}.json`))).toBeTruthy()

    const taxonomyContent = fs.readFileSync(
      path.join(surveyExtractedPath, 'taxonomies', `${taxonomyUuid}.json`),
      'utf8'
    )
    const taxonomy = JSON.parse(taxonomyContent)

    const taxonomyMockData = fs.readFileSync(
      path.resolve(__dirname, '..', 'resources', 'taxonomies', 'species list valid with predefined.csv')
    )
    const taxonomyMockDataParsed = csvParseSync(taxonomyMockData, { columns: true, skip_empty_lines: true })

    const taxonomyMockDataParsedByCode = taxonomyMockDataParsed.reduce(
      (acc, taxon) => ({ ...acc, [taxon.code]: { ...taxon } }),
      {}
    )
    const taxonomyTaxaByCode = taxonomy.reduce((acc, taxon) => ({ ...acc, [Taxon.getCode(taxon)]: { ...taxon } }), {})

    await expect(Object.keys(taxonomyMockDataParsedByCode).sort()).toEqual(Object.keys(taxonomyTaxaByCode).sort())

    await taxonomy.reduce(async (promise, taxon) => {
      await promise
      return (async () => {
        const code = Taxon.getCode(taxon)
        await expect(code).toBe(taxonomyMockDataParsedByCode[code].code)
        await expect(Taxon.getGenus(taxon)).toBe(taxonomyMockDataParsedByCode[code].genus)
        await expect(Taxon.getFamily(taxon)).toBe(taxonomyMockDataParsedByCode[code].family)

        await expect(Taxon.getScientificName(taxon)).toBe(taxonomyMockDataParsedByCode[code].scientific_name)

        const vernacularNamesByLang = Taxon.getVernacularNames(taxon)

        await expect(TaxonVernacularName.getName(vernacularNamesByLang?.eng?.[0]) || '').toBe(
          taxonomyMockDataParsedByCode[code].eng || ''
        )
        await expect(TaxonVernacularName.getName(vernacularNamesByLang?.swa?.[0]) || '').toBe(
          taxonomyMockDataParsedByCode[code].swa || ''
        )
      })()
    }, true)
  })

  test('Check records', async () => {
    await expect(fs.existsSync(path.join(surveyExtractedPath, 'records'))).toBeTruthy()
  })

  test('Check files', async () => {
    await expect(true).toBeTruthy()
  })

  test('Remove files', async () => {
    if (fs.existsSync(surveyZipPath)) {
      fs.unlinkSync(surveyZipPath)
    }

    await expect(surveyZipPath).not.toBeTruthy()

    if (fs.existsSync(path.join(downloadPath, 'extracted'))) {
      fs.unlinkSync(path.join(downloadPath, 'extracted'))
    }

    await expect(path.join(downloadPath, 'extracted')).not.toBeTruthy()
  })
})
