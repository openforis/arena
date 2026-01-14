import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { ExportFileNameGenerator } from '@common/dataExport/exportFileNameGenerator'
import * as API from '@webapp/service/api'

import { ButtonDownload } from '@webapp/components/buttons'

import { JobActions } from '@webapp/store/app'
import { useSurveyId, useSurveyInfo } from '@webapp/store/survey'

export const useExportAll = () => {
  const surveyId = useSurveyId()
  const survey = useSurveyInfo()
  const dispatch = useDispatch()

  // always export draft properties
  const draft = true

  return useCallback(
    async ({ fileFormat }) => {
      const { job } = await API.startExportAllCategoriesJob({ surveyId, draft, fileFormat })

      const downloadFileName = ExportFileNameGenerator.generate({
        survey,
        fileType: 'categories',
        fileFormat,
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
    [dispatch, draft, survey, surveyId]
  )
}
