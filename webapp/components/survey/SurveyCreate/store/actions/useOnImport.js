import { useCallback } from 'react'
import axios from 'axios'

import { objectToFormData } from '@webapp/service/api'

import { importSources } from '../importSources'
import { FileProcessor } from '@webapp/utils/FileProcessor'
import { Chunks } from '@webapp/utils/chunks'

const urlBySource = {
  [importSources.collect]: '/api/survey/collect-import',
  [importSources.arena]: '/api/survey/arena-import',
}

const onChunk =
  ({ onUploadProgress, newSurvey, setNewSurvey, resolve }) =>
  async ({ chunk, totalChunks, content }) => {
    const { fileId, source, ...surveyObj } = newSurvey

    const formData = objectToFormData({
      file: content,
      fileId,
      chunk,
      totalChunks,
      survey: JSON.stringify(surveyObj),
    })

    const { data } = await axios.post(urlBySource[source], formData, {
      onUploadProgress: Chunks.onUploadProgress({ totalChunks, chunk, onUploadProgress }),
    })

    if (chunk === totalChunks) {
      setNewSurvey((prevNewSurvey) => ({ ...prevNewSurvey, uploading: false }))

      const { job, validation } = data
      resolve({ job, validation })
    }
  }

const onChunkError =
  ({ setNewSurvey, reject }) =>
  (error) => {
    setNewSurvey((prevNewSurvey) => ({ ...prevNewSurvey, uploading: false }))
    reject(error)
  }

export const useOnImport = ({ newSurvey, setNewSurvey }) =>
  useCallback(
    ({ startFromChunk = 1, onUploadProgress }) => {
      const { file } = newSurvey

      // reset upload progress (hide progress bar)
      setNewSurvey((prevNewSurvey) => ({ ...prevNewSurvey, uploadProgressPercent: -1, uploading: true }))

      let fileProcessor = null
      const promise = new Promise((resolve, reject) => {
        fileProcessor = new FileProcessor({
          file,
          chunkProcessor: onChunk({ onUploadProgress, newSurvey, setNewSurvey, resolve }),
          onError: onChunkError({ setNewSurvey, reject }),
        })
      })
      fileProcessor.start(startFromChunk)
      return { promise, processor: fileProcessor }
    },
    [newSurvey, setNewSurvey]
  )
