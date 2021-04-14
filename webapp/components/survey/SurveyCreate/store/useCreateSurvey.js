import { useState } from 'react'

import { useActions } from './actions'

const initialSurvey = {
  name: '',
  label: '',
  lang: 'en',
  cloneFrom: '',
  template: false,
  validation: {},
}

export const useCreateSurvey = ({ template = false } = {}) => {
  const [newSurvey, setNewSurvey] = useState({ ...initialSurvey, template })

  const { onUpdate, onCreate, onImport } = useActions({
    newSurvey,
    setNewSurvey,
  })

  return {
    newSurvey,
    onUpdate,
    onCreate,
    onImport,
  }
}
