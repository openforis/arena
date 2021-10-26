import { useCallback } from 'react'

import * as API from '@webapp/service/api'

import { ButtonDownload } from '@webapp/components/buttons'

import { JobActions } from '@webapp/store/app'
import { useSurveyId } from '@webapp/store/survey'

export const useExportAll = () => {
  const surveyId = useSurveyId()

  return useCallback(async () => {
    const { job } = await API.startExportAllCategoriesJob({ surveyId, draft: true })

    dispatch(
      JobActions.showJobMonitor({
        job,
        onComplete: (jobCompleted) => dispatch(_onExportComplete({ job: jobCompleted })),
        closeButton: (
          <ButtonDownload
            href={`/api/survey/${surveyId}/categories/export/download`}
            onClick={() => dispatch(JobActions.hideJobMonitor())}
          />
        ),
      })
    )
  }, [])
}
