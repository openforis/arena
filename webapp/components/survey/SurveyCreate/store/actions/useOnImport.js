import { useCallback } from 'react'
import axios from 'axios'

import { FileProcessor } from '@openforis/arena-core'

import { objectToFormData } from '@webapp/service/api'
import { Chunks } from '@webapp/utils/chunks'

import { importSources } from '../importSources'

const urlBySource = {
  [importSources.collect]: '/api/survey/collect-import',
  [importSources.arena]: '/api/survey/arena-import',
}

const createChunkProcessor =
  ({ onUploadProgress, newSurvey }) =>
  async ({ chunk, totalChunks, content }) => {
    const { fileId, source, ...surveyObj } = newSurvey

    const formData = objectToFormData({
      fileId,
      file: content,
      chunk,
      totalChunks,
      survey: JSON.stringify(surveyObj),
    })
    const { data } = await axios.post(urlBySource[source], formData, {
      onUploadProgress: Chunks.onUploadProgress({ totalChunks, chunk, onUploadProgress }),
    })
    return data
  }

const createOnCompleteHandler =
  ({ setNewSurvey, resolve }) =>
  (data) => {
    setNewSurvey((prevNewSurvey) => ({ ...prevNewSurvey, uploading: false }))
    const { job, validation } = data
    resolve({ job, validation })
  }

const createOnErrorHandler =
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
        const chunkProcessor = createChunkProcessor({ onUploadProgress, newSurvey })
        const onError = createOnErrorHandler({ setNewSurvey, reject })
        const onComplete = createOnCompleteHandler({ setNewSurvey, resolve })
        fileProcessor = new FileProcessor({ file, chunkProcessor, onError, onComplete })
      })
      fileProcessor.start(startFromChunk)
      return { promise, processor: fileProcessor }
    },
    [newSurvey, setNewSurvey]
  )
