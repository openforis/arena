import { ArenaServer } from '@openforis/arena-server'

import { uuidv4 } from '@core/uuid'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as SurveyFile from '@core/survey/surveyFile'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as SurveyFileService from '@server/modules/survey/service/surveyFileService'
import SurveyExportJob from '@server/modules/survey/service/surveyExport/surveyExportJob'
import ArenaImportJob from '@server/modules/arenaImport/service/arenaImport/arenaImportJob'
import SurveyCloneJob from '@server/modules/survey/service/clone/surveyCloneJob'

import * as SB from '../../utils/surveyBuilder'

import { getContextUser } from '../config/context'

describe('Survey files export/import - branding and doc-layout images', () => {
  let sourceSurveyId
  let logoFileUuid
  let logoContent
  let headerFileUuid
  let headerContent
  const createdSurveyIds = []

  beforeAll(async () => {
    // The integration test harness never runs the app bootstrap (server/system/appCluster.js),
    // so @openforis/arena-server's ServiceRegistry (e.g. the "userAuthToken" service used by
    // SurveyExportJob.generateDownloadToken) is never populated. Register services here,
    // mirroring what ArenaServer.init() does at real server startup, without the rest of that
    // routine (DB migrations, Express app, HTTP listener).
    ArenaServer.initServices()

    const user = getContextUser()

    const sourceSurvey = await SB.survey(
      user,
      SB.entity('root_entity', SB.attribute('item_no', NodeDef.nodeDefType.integer).key())
    ).buildAndStore()
    sourceSurveyId = Survey.getId(sourceSurvey)

    logoFileUuid = uuidv4()
    logoContent = Buffer.from('fake-logo-content')
    await SurveyFileService.insertFile(
      sourceSurveyId,
      SurveyFile.createFile({
        uuid: logoFileUuid,
        name: 'logo1.png',
        size: logoContent.length,
        content: logoContent,
        type: SurveyFile.SurveyFileType.brandingSurveyLogo1,
      })
    )
    await SurveyManager.updateSurveyProp(user, sourceSurveyId, 'branding', {
      surveyLogo1: { fileUuid: logoFileUuid },
    })

    headerFileUuid = uuidv4()
    headerContent = Buffer.from('fake-header-content')
    await SurveyFileService.insertFile(
      sourceSurveyId,
      SurveyFile.createFile({
        uuid: headerFileUuid,
        name: 'header.png',
        size: headerContent.length,
        content: headerContent,
        type: SurveyFile.SurveyFileType.surveyDocImage,
      })
    )
    await SurveyManager.updateSurveyProp(user, sourceSurveyId, 'surveyDocImages', [
      {
        uuid: headerFileUuid,
        props: {
          type: SurveyFile.SurveyFileType.surveyDocImage,
          name: 'header.png',
          size: headerContent.length,
          labels: { en: 'Header' },
          documentPlace: 'header',
        },
      },
    ])
  })

  afterAll(async () => {
    for (const surveyId of createdSurveyIds) {
      await SurveyManager.deleteSurvey(surveyId)
    }
    if (sourceSurveyId) await SurveyManager.deleteSurvey(sourceSurveyId)
  })

  test('branding logo and doc header image content survive backup export/import', async () => {
    const user = getContextUser()

    const exportJob = new SurveyExportJob({ surveyId: sourceSurveyId, user, backup: true })
    await exportJob.start()
    expect(exportJob.isSucceeded()).toBe(true)

    const { filePath } = exportJob.context

    const importJob = new ArenaImportJob({ filePath, user })
    await importJob.start()
    expect(importJob.isSucceeded()).toBe(true)

    const { surveyId: importedSurveyId } = importJob.result
    createdSurveyIds.push(importedSurveyId)

    const importedLogoContent = await SurveyFileService.fetchFileContentAsBuffer({
      surveyId: importedSurveyId,
      fileUuid: logoFileUuid,
    })
    expect(Buffer.compare(importedLogoContent, logoContent)).toBe(0)

    const importedHeaderContent = await SurveyFileService.fetchFileContentAsBuffer({
      surveyId: importedSurveyId,
      fileUuid: headerFileUuid,
    })
    expect(Buffer.compare(importedHeaderContent, headerContent)).toBe(0)
  })

  test('branding logo and doc header image content survive survey cloning', async () => {
    const user = getContextUser()

    const cloneJob = new SurveyCloneJob({ surveyId: sourceSurveyId, user })
    await cloneJob.start()
    expect(cloneJob.isSucceeded()).toBe(true)

    const { surveyId: clonedSurveyId } = cloneJob.result
    createdSurveyIds.push(clonedSurveyId)

    const clonedLogoContent = await SurveyFileService.fetchFileContentAsBuffer({
      surveyId: clonedSurveyId,
      fileUuid: logoFileUuid,
    })
    expect(Buffer.compare(clonedLogoContent, logoContent)).toBe(0)

    const clonedHeaderContent = await SurveyFileService.fetchFileContentAsBuffer({
      surveyId: clonedSurveyId,
      fileUuid: headerFileUuid,
    })
    expect(Buffer.compare(clonedHeaderContent, headerContent)).toBe(0)
  })
})
