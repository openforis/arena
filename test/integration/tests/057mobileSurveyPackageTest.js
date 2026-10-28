import { PassThrough } from 'node:stream'

import AdmZip from 'adm-zip'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import * as SurveyFile from '@core/survey/surveyFile'

import { writeSurveyMobilePackage } from '@server/modules/mobile/service/surveyMobilePackageService'
import * as SurveyFileManager from '@server/modules/survey/manager/surveyFileManager'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import { getContextUser } from '../config/context'

import * as SB from '../../utils/surveyBuilder'

// The Arena Mobile survey package has the same layout of the Arena format export:
// info.json, survey.json and surveyfiles/<uuid>.bin for the survey files referenced by the survey props.

const layerContent = Buffer.from(JSON.stringify({ type: 'FeatureCollection', features: [] }))
const logoContent = Buffer.from('logo image content')

const createSurveyFile = ({ type, name, content }) =>
  SurveyFile.createFile({ type, name, size: content.length, content })

const buildSurvey = (props = {}) =>
  SB.survey(getContextUser(), SB.entity('cluster', SB.attribute('cluster_no', NodeDef.nodeDefType.integer).key()))
    .props(props)
    .buildAndStore()

const writePackage = async (survey) => {
  const outputStream = new PassThrough()
  const chunks = []
  outputStream.on('data', (chunk) => chunks.push(chunk))
  await writeSurveyMobilePackage({ user: getContextUser(), survey, outputStream })
  return new AdmZip(Buffer.concat(chunks))
}

const getEntryNames = (zip) =>
  zip
    .getEntries()
    .map((entry) => entry.entryName)
    .sort((a, b) => a.localeCompare(b))

const readJsonEntry = (zip, name) => JSON.parse(zip.readAsText(name))

describe('Arena Mobile survey package', () => {
  const surveysToDelete = []

  afterAll(async () => {
    for (const survey of surveysToDelete) {
      await SurveyManager.deleteSurvey(Survey.getId(survey)) // NOSONAR
    }
  })

  test('survey with preloaded map layers and branding images', async () => {
    const layerFile = createSurveyFile({
      type: SurveyFile.SurveyFileType.preloadedMapLayer,
      name: 'layer.geojson',
      content: layerContent,
    })
    const logoFile = createSurveyFile({
      type: SurveyFile.SurveyFileType.brandingSurveyLogo1,
      name: 'logo.png',
      content: logoContent,
    })
    const layerUuid = SurveyFile.getUuid(layerFile)
    const logoUuid = SurveyFile.getUuid(logoFile)

    const survey = await buildSurvey({
      [Survey.infoKeys.preloadedMapLayersEnabled]: true,
      [Survey.infoKeys.preloadedMapLayers]: [{ ...layerFile, content: undefined }],
      [Survey.infoKeys.branding]: { surveyLogo1: { fileUuid: logoUuid, name: 'logo.png', size: logoContent.length } },
    })
    surveysToDelete.push(survey)
    const surveyId = Survey.getId(survey)
    await SurveyFileManager.insertFile(surveyId, layerFile)
    await SurveyFileManager.insertFile(surveyId, logoFile)

    const zip = await writePackage(survey)

    expect(getEntryNames(zip)).toEqual(
      ['info.json', 'survey.json', `surveyfiles/${layerUuid}.bin`, `surveyfiles/${logoUuid}.bin`].sort((a, b) =>
        a.localeCompare(b)
      )
    )
    const info = readJsonEntry(zip, 'info.json')
    expect(info.exportType).toBe('mobileSurvey')
    expect(info.survey).toEqual({ uuid: Survey.getUuid(survey), name: Survey.getName(survey) })
    expect(readJsonEntry(zip, 'survey.json').uuid).toBe(Survey.getUuid(survey))
    expect(zip.readFile(`surveyfiles/${layerUuid}.bin`)).toEqual(layerContent)
    expect(zip.readFile(`surveyfiles/${logoUuid}.bin`)).toEqual(logoContent)
  })

  test('survey without files', async () => {
    const survey = await buildSurvey()
    surveysToDelete.push(survey)

    const zip = await writePackage(survey)

    expect(getEntryNames(zip)).toEqual(['info.json', 'survey.json'])
  })

  test('file referenced by the survey but missing in the storage is skipped', async () => {
    const survey = await buildSurvey({
      [Survey.infoKeys.branding]: { surveyLogo1: { fileUuid: 'missing-file-uuid', name: 'logo.png', size: 10 } },
    })
    surveysToDelete.push(survey)

    const zip = await writePackage(survey)

    expect(getEntryNames(zip)).toEqual(['info.json', 'survey.json'])
  })
})
