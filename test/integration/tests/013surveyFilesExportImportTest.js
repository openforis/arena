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
import { FileImportBaseJob } from '@server/modules/arenaImport/service/arenaImport/jobs/filesImportBaseJob'
import SurveyFilesImportJob from '@server/modules/arenaImport/service/arenaImport/jobs/surveyFilesImportJob'

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

  test('import warns and skips missing branding/doc-layout image content regardless of skipMissingFiles (old zips predate these file types)', async () => {
    const surveyRefetched = await SurveyManager.fetchSurveyById({ surveyId: sourceSurveyId, draft: true })
    const fakeZipMissingAllEntries = { getEntryData: async () => null }

    for (const skipMissingFiles of [true, false]) {
      const importJob = new SurveyFilesImportJob({
        arenaSurveyFileZip: fakeZipMissingAllEntries,
        survey: surveyRefetched,
        surveyId: sourceSurveyId,
        skipMissingFiles,
      })
      await importJob.start()

      expect(importJob.isSucceeded()).toBe(true)
    }
  })

  test('storage quota pre-check sees the real byte size of branding files, not the hardcoded 0', async () => {
    const user = getContextUser()

    const exportJob = new SurveyExportJob({ surveyId: sourceSurveyId, user, backup: true })
    await exportJob.start()
    expect(exportJob.isSucceeded()).toBe(true)

    const { filePath } = exportJob.context

    // SurveyBranding.getBrandingFileSummaries (Task 1) hardcodes props.size to 0 for every
    // branding entry, since the branding descriptor stored in survey props never retains the
    // real file size. SurveyFilesImportJob must resolve real sizes for those entries before
    // calling FileImportBaseJob.checkFilesNotExceedingAvailableQuota, otherwise branding image
    // bytes silently don't count towards the target survey's storage quota. Spy on the quota
    // pre-check to inspect exactly what it was called with.
    const quotaCheckSpy = jest.spyOn(FileImportBaseJob.prototype, 'checkFilesNotExceedingAvailableQuota')

    const importJob = new ArenaImportJob({ filePath, user })
    await importJob.start()
    expect(importJob.isSucceeded()).toBe(true)

    const { surveyId: importedSurveyId } = importJob.result
    createdSurveyIds.push(importedSurveyId)

    // Several file-import jobs share FileImportBaseJob (e.g. record files); find the call made
    // by SurveyFilesImportJob by checking which one was given our branding logo's uuid.
    const surveyFilesImportCall = quotaCheckSpy.mock.calls.find(([fileSummaries]) =>
      fileSummaries.some((fileSummary) => SurveyFile.getUuid(fileSummary) === logoFileUuid)
    )
    expect(surveyFilesImportCall).toBeDefined()

    const [fileSummariesPassedToQuotaCheck] = surveyFilesImportCall
    const brandingSummaryPassedToQuotaCheck = fileSummariesPassedToQuotaCheck.find(
      (fileSummary) => SurveyFile.getUuid(fileSummary) === logoFileUuid
    )
    expect(SurveyFile.getSize(brandingSummaryPassedToQuotaCheck)).toBe(logoContent.length)

    quotaCheckSpy.mockRestore()
  })

  test('import still fails on missing preloadedMapLayer content when skipMissingFiles is false (pre-existing strict behavior preserved)', async () => {
    const user = getContextUser()
    const missingLayerFileUuid = uuidv4()
    await SurveyManager.updateSurveyProp(user, sourceSurveyId, 'preloadedMapLayers', [
      {
        uuid: missingLayerFileUuid,
        props: {
          type: SurveyFile.SurveyFileType.preloadedMapLayer,
          name: 'layer.json',
          size: 10,
        },
      },
    ])
    const surveyRefetched = await SurveyManager.fetchSurveyById({ surveyId: sourceSurveyId, draft: true })
    const fakeZipMissingAllEntries = { getEntryData: async () => null }

    const importJobStrict = new SurveyFilesImportJob({
      arenaSurveyFileZip: fakeZipMissingAllEntries,
      survey: surveyRefetched,
      surveyId: sourceSurveyId,
      skipMissingFiles: false,
    })
    await importJobStrict.start()
    expect(importJobStrict.isFailed()).toBe(true)

    const importJobSkip = new SurveyFilesImportJob({
      arenaSurveyFileZip: fakeZipMissingAllEntries,
      survey: surveyRefetched,
      surveyId: sourceSurveyId,
      skipMissingFiles: true,
    })
    await importJobSkip.start()
    expect(importJobSkip.isSucceeded()).toBe(true)

    // Restore sourceSurveyId's props: this test is the last one in the file and mutates a prop
    // no other test reads, but reset it anyway so this file stays order-independent.
    await SurveyManager.updateSurveyProp(user, sourceSurveyId, 'preloadedMapLayers', [])
  })
})
