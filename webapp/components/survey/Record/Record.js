import React from 'react'
import PropTypes from 'prop-types'

import SurveyForm from '@webapp/components/survey/SurveyForm'

import { State, useLocalState } from './store'

const Record = ({ canEditDef }) => {
  const { state } = useLocalState({ canEditDef })

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

Record.propTypes = {
  canEditDef: PropTypes.bool,
}

Record.defaultProps = {
  canEditDef: false,
}

export default Record
