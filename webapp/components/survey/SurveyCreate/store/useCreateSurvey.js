import { useState } from 'react'

import { Objects, UUIDs } from '@openforis/arena-core'

import { SurveyType } from '@webapp/model'

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
  cloneFrom: null,
  cloneFromType: SurveyType.template,
  cloneFromCycle: null,
  template: false,
  options: { includeData: false },
  source: importSources.arena,
  validation: {},
}

export const useCreateSurvey = ({ template = false } = {}) => {
  const [newSurvey, setNewSurvey] = useState({ ...initialState, template })

  const { onUpdate, onCreate, onImport, onImportJobStart, onImportUploadCancel } = useActions({
    newSurvey,
    setNewSurvey,
  })

  const onCreateTypeUpdate = (createType) => {
    const newSurveyProps = { createType }

    switch (createType) {
      case createTypes.fromScratch:
        break
      default:
        // reset label and lang (they will be hidden)
        newSurveyProps.label = ''
        newSurveyProps.lang = 'en'
    }
    setNewSurvey((surveyPrev) => ({ ...surveyPrev, ...newSurveyProps }))
  }

  const onOptionChange = ({ key, value }) => {
    setNewSurvey((surveyPrev) => Objects.assocPath({ obj: surveyPrev, path: ['options', key], value }))
  }

  const onSourceChange = (value) => {
    setNewSurvey((surveyPrev) => ({ ...surveyPrev, source: value, file: null, fileId: null }))
  }

  const onFilesDrop = (files) => {
    const file = files[0]
    setNewSurvey((surveyPrev) => ({ ...surveyPrev, file, fileId: UUIDs.v4() }))
  }

  return {
    newSurvey,
    onUpdate,
    onCreate,
    onImport,
    onImportJobStart,
    onImportUploadCancel,
    onCreateTypeUpdate,
    onFilesDrop,
    onOptionChange,
    onSourceChange,
  }
}
