import { useState } from 'react'

import { useActions } from './actions'

const initialSurvey = {
  name: '',
  label: '',
  lang: 'en',
  cloneFrom: '',
  validation: {},
}

export const useCreateSurvey = () => {
  const [newSurvey, setNewSurvey] = useState(initialSurvey)

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
