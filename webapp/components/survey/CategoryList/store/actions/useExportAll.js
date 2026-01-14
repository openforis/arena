import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { FileFormats } from '@core/fileFormats'
import { ExportFileNameGenerator } from '@common/dataExport/exportFileNameGenerator'

import { ButtonDownload } from '@webapp/components/buttons'
import * as API from '@webapp/service/api'
import { JobActions } from '@webapp/store/app'
import { useSurveyId, useSurveyName } from '@webapp/store/survey'

export const useExportAll = () => {
  const surveyId = useSurveyId()
  const surveyName = useSurveyName()
  const dispatch = useDispatch()

  // always export draft properties
  const draft = true

  return useCallback(
    async ({ fileFormat }) => {
      const { job } = await API.startExportAllCategoriesJob({ surveyId, draft, fileFormat })

      const downloadFileName = ExportFileNameGenerator.generate({
        surveyName,
        fileType: 'categories',
        fileFormat: FileFormats.zip,
      })

      dispatch(
        JobActions.showJobMonitor({
          job,
          closeButton: ({ job: jobCompleted }) => {
            const { tempFileName } = jobCompleted.result
            return (
              <ButtonDownload
                fileName={downloadFileName}
                href={`/api/survey/${surveyId}/categories/export/download`}
                requestParams={{ tempFileName, draft }}
                onClick={() => dispatch(JobActions.hideJobMonitor())}
                variant="contained"
              />
            )
          },
        })
      )
    },
    [dispatch, draft, surveyId, surveyName]
  )
}
