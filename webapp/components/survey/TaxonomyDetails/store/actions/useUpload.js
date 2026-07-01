import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as JobSerialized from '@common/job/jobSerialized'

import * as Taxonomy from '@core/survey/taxonomy'
import { FileFormats } from '@core/fileFormats'

import * as API from '@webapp/service/api'

import { JobActions } from '@webapp/store/app'
import { SurveyActions, useSurveyId } from '@webapp/store/survey'
import { FileUtils } from '@webapp/utils/fileUtils'
import { NotificationActions } from '@webapp/store/ui'

import { State } from '../state'
import { useRefreshTaxonomy } from './useRefreshTaxonomy'

const allowedFileFormats = [FileFormats.csv, FileFormats.xlsx]

export const useUpload = ({ setState }) => {
  const dispatch = useDispatch()

  const refreshTaxonomy = useRefreshTaxonomy({ setState })
  const surveyId = useSurveyId()

  const onUploadComplete = useCallback(
    async ({ taxonomyUuid, job }) => {
      await refreshTaxonomy({ taxonomyUuid })
      dispatch(SurveyActions.metaUpdated())
      const missingPublishedTaxaCodes = JobSerialized.getResult(job)?.missingPublishedTaxaCodes
      if (missingPublishedTaxaCodes?.length > 0) {
        const maxDisplayCodes = 10
        const codes = missingPublishedTaxaCodes.slice(0, maxDisplayCodes).join(', ')
        const extra = missingPublishedTaxaCodes.length - maxDisplayCodes
        const key =
          extra > 0 ? 'taxonomy.edit.importMissingPublishedTaxaTruncated' : 'taxonomy.edit.importMissingPublishedTaxa'
        dispatch(
          NotificationActions.notifyWarning({
            key,
            params: { count: missingPublishedTaxaCodes.length, codes, extra },
            autoHide: false,
          })
        )
      }
    },
    [dispatch, refreshTaxonomy]
  )

  return useCallback(
    async ({ state, file }) => {
      const fileFormat = FileUtils.determineFileFormatFromFileName(file.name)
      if (!allowedFileFormats.includes(fileFormat)) {
        const extension = FileUtils.getExtension(file)
        dispatch(
          NotificationActions.notifyWarning({ key: 'dropzone.error.invalidFileExtension', params: { extension } })
        )
        return
      }
      const taxonomy = State.getTaxonomy(state)
      const taxonomyUuid = Taxonomy.getUuid(taxonomy)
      const formData = API.objectToFormData({ file, fileFormat })

      const { data } = await API.uploadTaxa({ surveyId, taxonomyUuid, formData })

      dispatch(
        JobActions.showJobMonitor({
          job: data.job,
          onComplete: async (job) => onUploadComplete({ taxonomyUuid, job }),
        })
      )
    },
    [dispatch, onUploadComplete, surveyId]
  )
}
