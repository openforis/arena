import React from 'react'

import SurveyFormView from '@webapp/components/survey/SurveyForm'
import { State, useLocalState } from './store'

const Record = () => {
  const { state } = useLocalState()

  if (!State.isLoaded(state)) {
    return null
  }
  return (
    <SurveyFormView
      draft={State.isPreview(state)}
      preview={State.isPreview(state)}
      edit={false}
      entry
      canEditRecord={State.isEditable(state)}
    />
  )
}

export default Record
