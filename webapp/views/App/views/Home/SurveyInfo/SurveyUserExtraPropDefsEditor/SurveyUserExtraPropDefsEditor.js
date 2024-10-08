import React, { useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'

import { ExtraPropDefsEditor } from '@webapp/components/survey/ExtraPropDefsEditor'
import { ExtraPropDef } from '@core/survey/extraPropDef'

export const SurveyUserExtraPropDefsEditor = (props) => {
  const { extraPropDefs = {}, onExtraPropDefsChange } = props

  const userExtraPropDefsArray = useMemo(() => ExtraPropDef.extraDefsToArray(extraPropDefs), [extraPropDefs])

  const onExtraPropDefUpdate = useCallback(
    ({ extraPropDef }) => {
      const extraPropDefsUpdated = { ...extraPropDefs, [ExtraPropDef.getName(extraPropDef)]: extraPropDef }
      onExtraPropDefsChange(extraPropDefsUpdated)
    },
    [extraPropDefs, onExtraPropDefsChange]
  )

  const onExtraPropDefDelete = useCallback(
    ({ propName }) => {
      const extraPropDefsUpdated = { ...extraPropDefs }
      delete extraPropDefs[propName]
      onExtraPropDefsChange(extraPropDefsUpdated)
    },
    [extraPropDefs, onExtraPropDefsChange]
  )

  return (
    <ExtraPropDefsEditor
      extraPropDefs={userExtraPropDefsArray}
      onExtraPropDefDelete={onExtraPropDefDelete}
      onExtraPropDefUpdate={onExtraPropDefUpdate}
    />
  )
}

SurveyUserExtraPropDefsEditor.propTypes = {
  extraPropDefs: PropTypes.object.isRequired,
  onExtraPropDefsChange: PropTypes.func.isRequired,
}
