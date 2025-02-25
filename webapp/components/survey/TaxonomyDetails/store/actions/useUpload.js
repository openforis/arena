import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as Taxonomy from '@core/survey/taxonomy'
import { FileFormats } from '@core/fileFormats'

import * as API from '@webapp/service/api'

import { JobActions } from '@webapp/store/app'
import { SurveyActions, useSurveyId } from '@webapp/store/survey'
import { FileUtils } from '@webapp/utils/fileUtils'

import { State } from '../state'
import { useRefreshTaxonomy } from './useRefreshTaxonomy'
import { NotificationActions } from '@webapp/store/ui'

const allowedFileFormats = [FileFormats.csv, FileFormats.xlsx]

export const useUpload = ({ setState }) => {
  const dispatch = useDispatch()

  const refreshTaxonomy = useRefreshTaxonomy({ setState })
  const surveyId = useSurveyId()

  const onUploadComplete = async ({ taxonomyUuid }) => {
    await refreshTaxonomy({ taxonomyUuid })
    dispatch(SurveyActions.metaUpdated())
  }

  return useCallback(async ({ state, file }) => {
    const fileFormat = FileUtils.determineFileFormatFromFileName(file.name)
    if (!allowedFileFormats.includes(fileFormat)) {
      const extension = FileUtils.getExtension(file)
      dispatch(NotificationActions.notifyWarning({ key: 'dropzone.error.invalidFileExtension', params: { extension } }))
      return
    }
    const taxonomy = State.getTaxonomy(state)
    const taxonomyUuid = Taxonomy.getUuid(taxonomy)
    const formData = API.objectToFormData({ file, fileFormat })

    const { data } = await API.uploadTaxa({ surveyId, taxonomyUuid, formData })

    await dispatch(
      JobActions.showJobMonitor({
        job: data.job,
        onComplete: async () => onUploadComplete({ taxonomyUuid }),
      })
    )
  }, [])
}
