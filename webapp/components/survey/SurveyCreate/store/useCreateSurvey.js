import { useCallback, useState } from 'react'

import { useActions } from './actions'

export const createTypes = {
  fromScratch: 'fromScratch',
  clone: 'clone',
  import: 'import',
}

const initialState = {
  createType: 'fromScratch',
  name: '',
  label: '',
  lang: 'en',
  cloneFrom: '',
  template: false,
  validation: {},
  uploadProgressPercent: -1,
}

export const useCreateSurvey = ({ template = false } = {}) => {
  const [newSurvey, setNewSurvey] = useState({ ...initialState, template })

  const { onUpdate, onCreate, onImport } = useActions({
    newSurvey,
    setNewSurvey,
  })

  const onCreateTypeUpdate = (createType) => {
    const newSurveyUpdated = { ...newSurvey, createType }

    switch (createType) {
      case createTypes.fromScratch:
        break
      default:
        // reset label and lang (they will be hidden)
        newSurveyUpdated.label = ''
        newSurveyUpdated.lang = 'en'
    }
    setNewSurvey(newSurveyUpdated)
  }

  const onUploadProgress = useCallback(
    (progressPercent) => {
      const newSurveyUpdated = { ...newSurvey, uploadProgressPercent: progressPercent }
      setNewSurvey(newSurveyUpdated)
    },
    [newSurvey, setNewSurvey]
  )

  return {
    newSurvey,
    onUpdate,
    onCreate,
    onImport,
    onCreateTypeUpdate,
    onUploadProgress,
  }
}
