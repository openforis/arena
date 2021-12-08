import React from 'react'

import SurveyForm from '@webapp/components/survey/SurveyForm'

import { State, useLocalState } from './store'

const Record = (props) => {
  const { recordUuid, pageNodeUuid } = props
  const { state } = useLocalState({ recordUuid, pageNodeUuid })

  if (!State.isLoaded(state)) {
    return null
  }
  return (
    <SurveyForm
      draft={State.isPreview(state)}
      preview={State.isPreview(state)}
      edit={false}
      entry
      canEditRecord={State.isEditable(state)}
    />
  )
}

export default Record
