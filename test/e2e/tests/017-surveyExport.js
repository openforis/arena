/*
 * @jest-environment node
 */

import path from 'path'
import fs from 'fs'
import axios from 'axios'
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

import * as Record from '@core/record/record'
import * as Node from '@core/record/node'

import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'
import * as Calculation from '@common/analysis/processingStepCalculation'

import { waitFor, reload, click, expectExists, toLeftOf, intercept } from '../utils/api'

import { expectHomeDashboard } from '../utils/ui/home'
import { clickSidebarBtnHome } from '../utils/ui/sidebar'

import { records as recordsMockData } from '../resources/records/recordsData'
import { ClusterNodeDefItems, PlotNodeDefItems, TreeNodeDefItems } from '../resources/nodeDefs/nodeDefs'

axios.defaults.adapter = require('axios/lib/adapters/http')

const basePath = process.env.GITHUB_WORKSPACE || __dirname
const downloadPath = basePath //path.resolve(basePath, 'data', 'downloaded')
const surveyZipPath = path.join(downloadPath, 'survey_survey.zip')
const extractedPath = path.join(downloadPath, 'extracted')
const surveyExtractedPath = path.join(extractedPath, 'survey_survey')

const includeAnalysis = true

const checkNode = async ({ node, expectedNode }) => {
  await expect(NodeDef.getName(node)).toBe(expectedNode.name)
  await expect(NodeDef.getLabel(node, 'en')).toBe(expectedNode.label)
  await expect(NodeDef.getType(node)).toBe(expectedNode.type)
  await expect(NodeDef.isKey(node)).toBe(expectedNode.isKey || false)
  await expect(NodeDef.isAnalysis(node)).toBe(expectedNode.isAnalysis || false)
}

const getSurveyNodeDefsToTest = () => {
  const contentSurvey = fs.readFileSync(path.join(surveyExtractedPath, 'survey.json'), 'utf8')
  const survey = JSON.parse(contentSurvey)
  const root = Survey.getNodeDefRoot(survey)
  const clusterNodeDefDefChildren = Survey.getNodeDefChildren(root, includeAnalysis)(survey)
  const plotNodeDef = clusterNodeDefDefChildren.find(
    (nodeDef) => NodeDef.isMultiple(nodeDef) && NodeDef.getName(nodeDef) === 'plot'
  )
  const plotNodeDefChildren = Survey.getNodeDefChildren(plotNodeDef, includeAnalysis)(survey)
  const treeNodeDef = plotNodeDefChildren.find((node) => NodeDef.getName(node) === 'tree')
  const treeNodeDefChildren = Survey.getNodeDefChildren(treeNodeDef, includeAnalysis)(survey)

  return {
    clusterNodeDef: root,
    clusterNodeDefDefChildren,
    plotNodeDef,
    plotNodeDefChildren,
    treeNodeDef,
    treeNodeDefChildren,
  }
}

const checkFileAndGetContent = async ({ filePath }) => {
  await expect(fs.existsSync(filePath)).toBeTruthy()
  const content = fs.readFileSync(filePath, 'utf8')
  return JSON.parse(content)
}
const getSurvey = () => {
  const contentSurvey = fs.readFileSync(path.join(surveyExtractedPath, 'survey.json'), 'utf8')
  const survey = JSON.parse(contentSurvey)
  return survey
}

const nodeHasSameValueAsMockNode = ({ node, mockNode, survey }) => {
  if (
    mockNode.type === NodeDef.nodeDefType.coordinate &&
    Node.getCoordinateX(node) === String(mockNode.value.x) &&
    Node.getCoordinateY(node) === String(mockNode.value.y) &&
    `GCS WGS 1984 (EPSG:${Node.getCoordinateSrs(node)})` === String(mockNode.value.srs)
  ) {
    return true
  }
  if (
    mockNode.type === NodeDef.nodeDefType.code &&
    CategoryItem.getLabel('en')(Survey.getCategoryItemByUuid(Node.getCategoryItemUuid(node))(survey)) === mockNode.value
  ) {
    return true
  }
  return Node.getValue(node) === String(mockNode.value)
}
const findNodeWithSameValueAsMockNode = ({ nodes, mockNode, parentUuid, survey }) =>
  nodes.find((_node) => {
    if (parentUuid && Node.getParentUuid(_node) !== parentUuid) return false
    return nodeHasSameValueAsMockNode({ node: _node, mockNode, survey })
  })

const checkRecordFileAndContent = async ({ recordUuid, mockRecords, surveyNodeDefsToTest, survey }) => {
  const record = await checkFileAndGetContent({
    filePath: path.join(surveyExtractedPath, 'records', `${recordUuid}.json`),
  })

  await expect(Record.getUuid(record)).toBe(recordUuid)

  const { clusterNodeDef, clusterNodeDefDefChildren, plotNodeDef, plotNodeDefChildren } = surveyNodeDefsToTest

  const clusterIdNodeDef = clusterNodeDefDefChildren.find((nodeDef) => NodeDef.getLabel(nodeDef, 'en') === 'Cluster id')

  const [clusterIdNode] = Record.getNodesByDefUuid(NodeDef.getUuid(clusterIdNodeDef))(record)

  const mockRecord = mockRecords.find(
    (_mockRecord) => String(_mockRecord.cluster[0].value) === String(Node.getValue(clusterIdNode))
  )

  // check record
  // check record -> root[cluster]
  const clusterNodeDefUuid = NodeDef.getUuid(clusterNodeDef)
  const clusterNode = Record.getNodesByDefUuid(clusterNodeDefUuid)(record)
  await expect(clusterNode).toBeTruthy()

  await Promise.all(
    mockRecord.cluster.map(async (mockNode) => {
      const nodeNodeDef = clusterNodeDefDefChildren.find(
        (nodeDef) => NodeDef.getLabel(nodeDef, 'en') === mockNode.label
      )
      const [node] = Record.getNodesByDefUuid(NodeDef.getUuid(nodeNodeDef))(record)

      if (nodeHasSameValueAsMockNode({ node, mockNode, survey })) {
        await expect(nodeHasSameValueAsMockNode({ node, mockNode, survey })).toBe(true)
      } else {
        await expect(mockNode).toBe(node)
      }
    })
  )

  // Check record -> plots
  const plotsNodes = Record.getNodesByDefUuid(NodeDef.getUuid(plotNodeDef))(record)
  await expect(plotsNodes.length).toBe(mockRecord.plots.length)

  await Promise.all(
    mockRecord.plots.map(async (mockPlot) => {
      const plotIdNodeDef = plotNodeDefChildren.find((nodeDef) => NodeDef.getLabel(nodeDef, 'en') === 'Plot id')
      const plotIdNodes = Record.getNodesByDefUuid(NodeDef.getUuid(plotIdNodeDef))(record)
      const plotIdNode = plotIdNodes.find(
        (_plotIdNode) => String(Node.getValue(_plotIdNode)) === String(mockPlot[0].value)
      )
      const plotUuid = Node.getParentUuid(plotIdNode)

      await Promise.all(
        mockPlot.map(async (mockNode) => {
          const nodeNodeDef = plotNodeDefChildren.find((nodeDef) => NodeDef.getLabel(nodeDef, 'en') === mockNode.label)
          const nodes = Record.getNodesByDefUuid(NodeDef.getUuid(nodeNodeDef))(record)
          await expect(nodes.length).toBe(mockRecord.plots.length)

          const node = findNodeWithSameValueAsMockNode({ nodes, mockNode, parentUuid: plotUuid, survey })

          await expect(node).toBeTruthy()
        })
      )
    })
  )
}

const checkLevelAndReturnLevel = async ({ levels, categoryName, index }) => {
  const level = levels.find((category) => CategoryLevel.getName(category) === categoryName)
  await expect(level).toBeTruthy()
  await expect(CategoryLevel.getName(level)).toBe(categoryName)
  await expect(CategoryLevel.getIndex(level)).toBe(index)
  return level
}

describe('Survey export', () => {
  test('Download survey zip', async () => {
    await reload()
    await waitFor(5000)

    await clickSidebarBtnHome()
    await expectHomeDashboard({ label: 'Survey' })
    await waitFor(5000)

    const fetchAndSaveSurvey = async (
      request = { request: { request: { url: 'http://localhost:9000/api/survey/1/export' } } }
    ) => {
      const responseAuth = await axios.post(`${request.request.url.split('api')[0]}auth/login`, {
        email: 'test@arena.com',
        password: 'test',
      })
      const { headers } = responseAuth

      const response = await axios({
        url: request.request.url,
        method: 'GET',
        responseType: 'arraybuffer',
        headers: {
          Cookie: headers['set-cookie'],
        },
      })

      fs.readdirSync(downloadPath).forEach((file) => {
        console.log('a', file)
      })

      fs.writeFileSync(surveyZipPath, response.data)

      fs.readdirSync(downloadPath).forEach((file) => {
        console.log(file)
      })

      await expect(surveyZipPath).toBeTruthy()
      await expect(fs.existsSync(surveyZipPath)).toBeTruthy()
      request.continue({})
    }

    await intercept(new RegExp(/export/), async (request) => fetchAndSaveSurvey(request))

    await expectExists({ text: 'Export' })
    await click('Export', toLeftOf('Delete'))
  }, 150000)

  test('Unzip file', async () => {
    await extract(surveyZipPath, { dir: extractedPath })
    await expect(fs.existsSync(extractedPath)).toBeTruthy()
    await expect(fs.existsSync(surveyExtractedPath)).toBeTruthy()
  })

  test('Check survey.json', async () => {
    await expect(fs.existsSync(path.join(surveyExtractedPath, 'survey.json'))).toBeTruthy()
    const survey = getSurvey()
    await expect(Survey.getName(Survey.getSurveyInfo(survey))).toBe('survey')
    await expect(Survey.getLabels(Survey.getSurveyInfo(survey))).toMatchObject({
      en: 'Survey',
    })
    const languages = Survey.getLanguages(Survey.getSurveyInfo(survey))
    await expect(languages.sort()).toEqual(['en', 'fr'].sort())
  })

  test('Check survey.json nodeDefs', async () => {
    const survey = getSurvey()

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

    const [countryLevel, regionLevel, districtLevel] = await Promise.all(
      ['country', 'region', 'district'].map(async (categoryName, index) =>
        checkLevelAndReturnLevel({ levels, categoryName, index })
      )
    )

    const administrativeUnitItems = await checkFileAndGetContent({
      filePath: path.join(surveyExtractedPath, 'categories', `${administrativeUnitUuid}.json`),
    })

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
    const chains = await checkFileAndGetContent({ filePath: path.join(surveyExtractedPath, 'chains', 'chains.json') })

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
    const taxonomies = await checkFileAndGetContent({
      filePath: path.join(surveyExtractedPath, 'taxonomies', 'taxonomies.json'),
    })

    const taxonomiesAsArray = Object.values(taxonomies)

    await expect(taxonomiesAsArray.length).toBe(1)

    const taxonomyUuid = Chain.getUuid(taxonomiesAsArray[0])
    await expect(Taxonomy.getName(taxonomiesAsArray[0])).toBe('tree_species')
    await expect(Taxonomy.getDescription('en')(taxonomiesAsArray[0])).toBe('Tree Species List')

    const taxonomy = await checkFileAndGetContent({
      filePath: path.join(surveyExtractedPath, 'taxonomies', `${taxonomyUuid}.json`),
    })

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

        await expect((vernacularNamesByLang?.eng || []).map(TaxonVernacularName.getName).join(' / ') || '').toBe(
          taxonomyMockDataParsedByCode[code].eng || ''
        )
        await expect((vernacularNamesByLang?.swa || []).map(TaxonVernacularName.getName).join(' / ') || '').toBe(
          taxonomyMockDataParsedByCode[code].swa || ''
        )
      })()
    }, true)
  })

  test('Check records', async () => {
    const records = await checkFileAndGetContent({
      filePath: path.join(surveyExtractedPath, 'records', 'records.json'),
    })

    const recordsAsArray = Object.values(records)

    await expect(recordsAsArray.length).toBe(5)

    const survey = getSurvey()

    const recordsUuids = recordsAsArray.map((record) => Record.getUuid(record))

    const surveyNodeDefsToTest = getSurveyNodeDefsToTest()

    await recordsUuids.reduce(async (promise, recordUuid) => {
      await promise
      return checkRecordFileAndContent({ recordUuid, mockRecords: recordsMockData, surveyNodeDefsToTest, survey })
    }, true)
  })

  test('Check files', async () => {
    await expect(true).toBeTruthy()
  })

  test('Remove files', async () => {
    if (fs.existsSync(surveyZipPath)) {
      fs.rmdirSync(surveyZipPath, { recursive: true })
    }

    await expect(fs.existsSync(surveyZipPath)).not.toBeTruthy()

    if (fs.existsSync(path.join(downloadPath, 'extracted'))) {
      fs.rmdirSync(path.join(downloadPath, 'extracted'), { recursive: true })
    }

    await expect(fs.existsSync(path.join(downloadPath, 'extracted'))).not.toBeTruthy()
  })
})
