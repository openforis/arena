import { useCallback } from 'react'

import { ButtonDownload } from '@webapp/components/buttons'
import * as API from '@webapp/service/api'
import { JobActions } from '@webapp/store/app'
import { useI18n } from '@webapp/store/system'
import { useSurveyId } from '@webapp/store/survey'
import { useAppDispatch } from '@webapp/store'

export const useExportToGeoPackage = () => {
  const surveyId = useSurveyId()
  const dispatch = useAppDispatch()
  const i18n = useI18n()

  return useCallback(
    async ({ categoryUuid }) => {
      const { job } = await API.startExportCategoryToGeoPackageJob({ surveyId, categoryUuid })

      dispatch(
        JobActions.showJobMonitor({
          job,
          closeButton: ({ job: jobCompleted }) => {
            const { tempFileName, skippedItems } = jobCompleted.result
            return (
              <>
                {skippedItems > 0 && (
                  <p>{i18n.t('categoryEdit.exportToGeoPackageSkippedItems', { count: skippedItems })}</p>
                )}
                <ButtonDownload
                  href={`/api/survey/${surveyId}/categories/${categoryUuid}/export/geopackage/download`}
                  requestParams={{ tempFileName }}
                  onClick={() => dispatch(JobActions.hideJobMonitor())}
                  variant="contained"
                />
              </>
            )
          },
        })
      )
    },
    [dispatch, surveyId, i18n]
  )
}
