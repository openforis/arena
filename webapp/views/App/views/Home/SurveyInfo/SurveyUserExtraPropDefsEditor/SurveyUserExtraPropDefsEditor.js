import React, { useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'

import * as ObjectUtils from '@core/objectUtils'
import { ExtraPropDef } from '@core/survey/extraPropDef'

import { ExtraPropDefsEditor } from '@webapp/components/survey/ExtraPropDefsEditor'

export const SurveyUserExtraPropDefsEditor = (props) => {
  const { extraPropDefs = {}, onExtraPropDefsChange } = props

  const userExtraPropDefsArray = useMemo(() => ExtraPropDef.extraDefsToArray(extraPropDefs), [extraPropDefs])

  const onExtraPropDefUpdate = useCallback(
    ({ extraPropDef }) => {
      let extraPropDefsArrayUpdated = [...userExtraPropDefsArray]
      extraPropDefsArrayUpdated[extraPropDef.index] = extraPropDef
      const extraPropDefsUpdated = ObjectUtils.toIndexedObj(extraPropDefsArrayUpdated, ExtraPropDef.keys.name)
      onExtraPropDefsChange(extraPropDefsUpdated)
    },
    [onExtraPropDefsChange, userExtraPropDefsArray]
  )

  const onExtraPropDefDelete = useCallback(
    ({ propName }) => {
      const extraPropDefsUpdated = { ...extraPropDefs }
      delete extraPropDefsUpdated[propName]
      onExtraPropDefsChange(extraPropDefsUpdated)
    },
    [extraPropDefs, onExtraPropDefsChange]
  )

  return (
    <ExtraPropDefsEditor
      availableDataTypes={[ExtraPropDef.dataTypes.number, ExtraPropDef.dataTypes.text]}
      extraPropDefs={userExtraPropDefsArray}
      infoTextKey="homeView.surveyInfo.userExtraProps.info"
      onExtraPropDefDelete={onExtraPropDefDelete}
      onExtraPropDefUpdate={onExtraPropDefUpdate}
    />
  )
}

SurveyUserExtraPropDefsEditor.propTypes = {
  extraPropDefs: PropTypes.object.isRequired,
  onExtraPropDefsChange: PropTypes.func.isRequired,
}
