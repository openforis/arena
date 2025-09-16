import { useCallback } from 'react'
import axios from 'axios'

import { objectToFormData } from '@webapp/service/api'

import { importSources } from '../importSources'
import { FileProcessor } from '@webapp/utils/FileProcessor'

const urlBySource = {
  [importSources.collect]: '/api/survey/collect-import',
  [importSources.arena]: '/api/survey/arena-import',
}

export const useOnImport = ({ newSurvey, setNewSurvey }) =>
  useCallback(
    ({ onUploadProgress }) => {
      const { file, fileId, source, ...surveyObj } = newSurvey

      // reset upload progress (hide progress bar)
      setNewSurvey({ ...newSurvey, uploadProgressPercent: -1, uploading: true })

      let fileProcessor = null
      const promise = new Promise((resolve, reject) => {
        fileProcessor = new FileProcessor({
          file,
          chunkProcessor: async ({ chunk, totalChunks, content }) => {
            const formData = objectToFormData({ file: content, fileId, survey: JSON.stringify(surveyObj) })

            const { data } = await axios.post(urlBySource[source], formData)

            onUploadProgress({ total: totalChunks, loaded: chunk })

            const uploadProgressPercent = Math.round((chunk / totalChunks) * 100)
            setNewSurvey({ ...newSurvey, uploading: uploadProgressPercent < 100 })

            if (chunk === totalChunks) {
              const { job, validation } = data
              resolve({ job, validation })
            }
          },
          onError: (error) => {
            reject(error)
          },
        })
      })
      return { promise, fileProcessor }
    },
    [newSurvey, setNewSurvey]
  )
