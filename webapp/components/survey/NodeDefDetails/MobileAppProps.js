import React, { useCallback } from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as Validation from '@core/validation/validation'

import { Checkbox } from '@webapp/components/form'

import { useAuthCanEditSurvey } from '@webapp/store/user'
import { useSurveyCycleKey } from '@webapp/store/survey'

import { State } from './store'

export const MobileAppProps = (props) => {
  const { state, Actions } = props

  const readOnly = !useAuthCanEditSurvey()

  const cycle = useSurveyCycleKey()
  const nodeDef = State.getNodeDef(state)
  const validation = State.getValidation(state)

  const canBeHiddenInMobile = NodeDef.canBeHiddenInMobile(nodeDef)
  const canIncludeInPreviousCycleLink = NodeDef.canIncludeInPreviousCycleLink(cycle)(nodeDef)

  const createLayoutPropCheckbox = useCallback(
    ({ prop }) => (
      <Checkbox
        checked={NodeDefLayout.getPropLayout(cycle, prop)(nodeDef)}
        disabled={readOnly}
        info={`nodeDefEdit.mobileAppProps.${prop}.info`}
        label={`nodeDefEdit.mobileAppProps.${prop}.label`}
        validation={Validation.getFieldValidation(prop)(validation)}
        onChange={(value) => Actions.setLayoutProp({ state, key: prop, value })}
      />
    ),
    [Actions, cycle, nodeDef, readOnly, state, validation]
  )

  return (
    <div className="form mobile-props">
      {canBeHiddenInMobile && createLayoutPropCheckbox({ prop: NodeDefLayout.keys.hiddenInMobile })}

      {canIncludeInPreviousCycleLink &&
        createLayoutPropCheckbox({ prop: NodeDefLayout.keys.includedInPreviousCycleLink })}
    </div>
  )
}

MobileAppProps.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}
