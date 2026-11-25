import { useState } from 'react'

import { type ArenaValidation, Objects, UUIDs } from '@openforis/arena-core'

import { SurveyType } from '@webapp/model'

import { useActions } from './actions'
import { importSources } from './importSources'

export const createTypes = {
  fromScratch: 'fromScratch',
  clone: 'clone',
  import: 'import',
}

type NewSurvey = {
  createType: string
  name: string
  label: string
  lang: string
  cloneFrom: { value?: number | string; cycles?: string[] } | null
  cloneFromType: string
  cloneFromCycle: string | null
  template: boolean
  options: { includeData: boolean }
  source: string
  validation?: ArenaValidation
  file?: File
  uploading?: boolean
}

const initialState: NewSurvey = {
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
}

export const useCreateSurvey = ({ template = false } = {}) => {
  const [newSurvey, setNewSurvey] = useState({ ...initialState, template })

  const { onUpdate, onCreate, onImport, onImportJobStart, onImportUploadCancel } = useActions({
    newSurvey,
    setNewSurvey,
  })

  const onCreateTypeUpdate = (createType) => {
    const newSurveyProps: Partial<NewSurvey> = { createType }

    if (createType !== createTypes.fromScratch) {
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
