import { useState } from 'react'

import { Objects } from '@openforis/arena-core'

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
  options: { includeData: false },
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

  const onOptionUpdate = ({ key, value }) => {
    const newSurveyUpdated = Objects.assocPath({ obj: newSurvey, path: ['options', key], value })
    setNewSurvey(newSurveyUpdated)
  }

  return {
    newSurvey,
    onUpdate,
    onCreate,
    onImport,
    onCreateTypeUpdate,
    onOptionUpdate,
  }
}
