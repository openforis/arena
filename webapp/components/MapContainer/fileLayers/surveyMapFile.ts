import * as API from '@webapp/service/api'

import type { MapFile } from './MapFileLayers'

export type SurveyFileRef = {
  fileUuid: string
  // its extension tells how the file is read
  fileName: string
  label?: string
}

/**
 * Downloads a survey file.
 * @param {object} params - Parameters.
 * @param {string} params.fileUuid - The survey file UUID.
 * @returns {Promise<File>} The file.
 */
export const fetchSurveyFileAsFile = async ({
  surveyId,
  fileUuid,
  fileName,
}: {
  surveyId: number
  fileUuid: string
  fileName: string
}): Promise<File> => {
  const { data } = await API.fetchSurveyFile({ surveyId, fileUuid, errorHandledLocally: true })
  return new File([data], fileName)
}

/**
 * Creates a map file that downloads a survey file.
 * @returns {MapFile} The map file.
 */
export const toSurveyMapFile = ({ surveyId, surveyFile }: { surveyId: number; surveyFile: SurveyFileRef }): MapFile => {
  const { fileUuid, fileName, label } = surveyFile
  return { getFile: () => fetchSurveyFileAsFile({ surveyId, fileUuid, fileName }), label }
}
