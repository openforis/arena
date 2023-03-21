import { useState } from 'react'

import { Objects } from '@openforis/arena-core'

import { useActions } from './actions'
import { importSources } from './importSources'

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
  source: importSources.arena,
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

  const onOptionChange = ({ key, value }) => {
    const newSurveyUpdated = Objects.assocPath({ obj: newSurvey, path: ['options', key], value })
    setNewSurvey(newSurveyUpdated)
  }

  const onSourceChange = (value) => {
    const newSurveyUpdated = { ...newSurvey, source: value }
    setNewSurvey(newSurveyUpdated)
  }

  const onFilesDrop = (files) => {
    const file = files[0]
    setNewSurvey({ ...newSurvey, file })
  }

  return {
    newSurvey,
    onUpdate,
    onCreate,
    onImport,
    onCreateTypeUpdate,
    onFilesDrop,
    onOptionChange,
    onSourceChange,
  }
}
