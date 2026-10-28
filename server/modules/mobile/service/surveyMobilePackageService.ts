import { Writable } from 'node:stream'

import { ArenaExportInfoFactory, ArenaExportType } from '@openforis/arena-core'
import { ZipArchive } from 'archiver'

import { AppInfo } from '@core/app/appInfo'
import * as Survey from '@core/survey/survey'
import { SurveyMobilePackage } from '@core/survey/surveyMobilePackage'
import * as User from '@core/user/user'

import * as Log from '@server/log/log'
import * as SurveyFileManager from '@server/modules/survey/manager/surveyFileManager'
import { ExportFile } from '@server/modules/survey/service/surveyExport/exportFile'

const logger = Log.getLogger('SurveyMobilePackageService')

const createInfo = ({ user, survey }: { user: any; survey: any }) =>
  ArenaExportInfoFactory.createInstance({
    appInfo: AppInfo.currentAppInfo,
    exportedByUserUuid: User.getUuid(user),
    exportType: ArenaExportType.mobileSurvey,
    survey: { uuid: Survey.getUuid(survey), name: Survey.getName(survey) },
  })

const appendSurveyFile = async ({
  zip,
  surveyId,
  fileUuid,
}: {
  zip: ZipArchive
  surveyId: number
  fileUuid: string
}) => {
  try {
    const contentStream = await SurveyFileManager.fetchFileContentAsStream({
      surveyId,
      fileSummary: { uuid: fileUuid, props: {} },
    })
    if (contentStream) {
      zip.append(contentStream, { name: ExportFile.surveyFile({ fileUuid }) })
    }
  } catch (error) {
    // a file missing in the storage must not break the download: the app treats it as not available
    logger.warn(`survey ${surveyId}: cannot read survey file ${fileUuid}: ${String(error)}`)
  }
}

/**
 * Writes the Arena Mobile survey package (zip with info.json, survey.json and the survey files, with the same layout
 * of the Arena format export) to the output stream.
 *
 * @param {object} params - Parameters.
 * @param {object} params.user - The user downloading the survey.
 * @param {object} params.survey - The survey, as returned by the mobile survey endpoint.
 * @param {Writable} params.outputStream - Stream the zip is written to (e.g. the HTTP response).
 * @returns {Promise<void>} - Resolves when the zip has been completely written.
 */
export const writeSurveyMobilePackage = async ({
  user,
  survey,
  outputStream,
}: {
  user: any
  survey: any
  outputStream: Writable
}): Promise<void> => {
  const surveyId = Survey.getId(survey)
  const fileSummaries = SurveyMobilePackage.getFileSummaries(Survey.getSurveyInfo(survey))

  const zip = new ZipArchive()
  const finished = new Promise<void>((resolve, reject) => {
    outputStream.on('finish', resolve)
    outputStream.on('error', reject)
    zip.on('error', reject)
  })
  zip.pipe(outputStream)

  zip.append(JSON.stringify(createInfo({ user, survey })), { name: ExportFile.info })
  zip.append(JSON.stringify(survey), { name: ExportFile.survey })
  for (const { uuid: fileUuid } of fileSummaries) {
    // files appended one at a time: archiver reads the entries sequentially anyway
    await appendSurveyFile({ zip, surveyId, fileUuid }) // NOSONAR
  }
  await zip.finalize()
  await finished
}
