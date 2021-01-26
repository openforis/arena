import fs from 'fs'
import path from 'path'
import axios from 'axios'

import { extractZip } from '@server/utils/file/fileZip'

import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'

import * as Chain from '@common/analysis/processingChain'
import * as Taxonomy from '@core/survey/taxonomy'
import { CSVReaderSync } from '@server/utils/file/csvReader'
import * as Taxon from '@core/survey/taxon'
import * as TaxonVernacularName from '@core/survey/taxonVernacularName'
import * as Category from '@core/survey/category'
import * as CategoryItem from '@core/survey/categoryItem'
import * as CategoryLevel from '@core/survey/categoryLevel'

import { click, expectExists, fileSelect, getElement, intercept, reload, toLeftOf, waitFor } from '../utils/api'

import { expectHomeDashboard } from '../utils/ui/home'
import { closeJobMonitor, expectExistsJobMonitorSucceeded } from '../utils/ui/jobMonitor'
import { clickHeaderBtnCreateSurvey } from '../utils/ui/header'
import { deleteSurvey } from '../utils/ui/deleteSurvey'

/*


 */
// https://stackoverflow.com/questions/42677387/jest-returns-network-error-when-doing-an-authenticated-request-with-axios
axios.defaults.adapter = require('axios/lib/adapters/http')

const basePath = process.env.GITHUB_WORKSPACE || __dirname
const downloadPath = basePath
let surveyZipPath = ''
let extractedPath = ''
let surveyExtractedPath = ''

// const includeAnalysis = true

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

  fs.writeFileSync(surveyZipPath, response.data)

  await expect(surveyZipPath).toBeTruthy()
  await expect(fs.existsSync(surveyZipPath)).toBeTruthy()
  request.continue({})
}

const checkLevelAndReturnLevel = async ({ levels, categoryName, index }) => {
  const level = levels.find((category) => CategoryLevel.getName(category) === categoryName)
  await expect(level).toBeTruthy()
  await expect(CategoryLevel.getName(level)).toBe(categoryName)
  await expect(CategoryLevel.getIndex(level)).toBe(index)
  return level
}

/*



 */

const fileZipName = 'survey_survey.zip'
// const surveyZipPath = path.join(downloadPath, fileZipName)

let surveyName = null
// ${name}-import-yyyy-MM-dd_hh-mm-ss
const surveyTitleRegExp = new RegExp(
  /survey-import-([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])_\d{2}-\d{2}-\d{2}) - Survey/
)
describe('Survey import', () => {
  test('Upload survey zip', async () => {
    await reload()
    await waitFor(5000)

    await clickHeaderBtnCreateSurvey()
    await fileSelect({ inputFileId: 'import-from-arena', fileRoot: downloadPath, fileName: fileZipName })

    await waitFor(5000)

    await expectExistsJobMonitorSucceeded()
    await closeJobMonitor()

    await expectHomeDashboard({ label: 'Survey' })

    await waitFor(5000)

    const headerSurveyTitle = await getElement({ selector: '.header__survey-title' })
    const headerSurveyTitleValue = await headerSurveyTitle.text()

    const [_surveyName, surveyLabel] = headerSurveyTitleValue.split(' - ')
    surveyName = _surveyName

    await expect(surveyTitleRegExp.test(headerSurveyTitleValue)).toBe(true)
    await expect(surveyLabel).toBe('Survey')

    await expectExists({ text: 'SURVEY' })
  }, 30000)

  test('Export survey imported', async () => {
    surveyZipPath = path.join(downloadPath, `survey_${surveyName}.zip`)
    extractedPath = path.join(downloadPath, 'extracted')
    surveyExtractedPath = path.join(extractedPath, `survey_${surveyName}`)

    await intercept(new RegExp(/export/), async (request) => fetchAndSaveSurvey(request))

    await expectExists({ text: 'Export' })
    await click('Export', toLeftOf('Delete'))
  })

  test('Unzip file', async () => {
    await extractZip(surveyZipPath, extractedPath)
    await expect(fs.existsSync(extractedPath)).toBeTruthy()
    await expect(fs.existsSync(surveyExtractedPath)).toBeTruthy()
  })

  test('Check survey.json', async () => {
    await expect(fs.existsSync(path.join(surveyExtractedPath, 'survey.json'))).toBeTruthy()
    const survey = getSurvey()
    await expect(Survey.getName(Survey.getSurveyInfo(survey))).toBe(surveyName)
    await expect(Survey.getLabels(Survey.getSurveyInfo(survey))).toMatchObject({
      en: 'Survey',
    })
    const languages = Survey.getLanguages(Survey.getSurveyInfo(survey))
    await expect(languages.sort()).toEqual(['en', 'fr'].sort())
  })

  test('Check users in imported survey', async () => {
    const users = await checkFileAndGetContent({
      filePath: path.join(surveyExtractedPath, 'users', 'users.json'),
    })

    const usersAsArray = Object.values(users)

    await expect(usersAsArray.length).toBe(1)

    const tester = usersAsArray.find((_user) => User.getEmail(_user) === 'test@arena.com')
    await expect(tester).toBeTruthy()
  })

  /* test('Remove files', async () => {
    if (fs.existsSync(path.join(downloadPath, 'extracted'))) {
      fs.rmdirSync(path.join(downloadPath, 'extracted'), { recursive: true })
    }

    await expect(fs.existsSync(path.join(downloadPath, 'extracted'))).not.toBeTruthy()
  }) */

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
    const taxonomyMockDataParsed = CSVReaderSync(taxonomyMockData, { columns: true, skip_empty_lines: true })

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

  test('delete a survey with name "survey" and label "Survey"', async () => {
    await deleteSurvey({ name: surveyName, label: 'Survey', needsToFind: false })
  })
})
