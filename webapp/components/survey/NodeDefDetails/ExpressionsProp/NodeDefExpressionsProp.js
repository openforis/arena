import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import * as NodeDef from '@core/survey/nodeDef'
import * as Validation from '@core/validation/validation'
import * as Expression from '@core/expressionParser/expression'

import ExpressionsProp from './ExpressionsProp'
import Radiobox from '@webapp/components/form/radiobox'
import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { State } from '../store'

const radioModes = {
  none: 'none',
  defined: 'defined',
}

const NodeDefExpressionsProp = (props) => {
  const {
    Actions,
    applyIf = true,
    canBeConstant = false,
    children = undefined,
    excludeCurrentNodeDef = false,
    hideAdvanced = false,
    info = null,
    isBoolean = true,
    isContextParent = false,
    label: labelProp = '',
    mode = Expression.modes.json,
    multiple = true,
    nodeDefUuidContext = null,
    onChange: onChangeProp = null,
    propName = null,
    propExtractor = null,
    qualifier,
    readOnly = false,
    showLabels = false,
    state,
    valueTypeSelection = false,
    determineValueType = null,
    valueConstantEditorNumberFormat = null,
    radioMode = true,
    radioLabels = { none: 'common.none', defined: 'common.defined' },
  } = props

  const i18n = useI18n()

  const nodeDef = State.getNodeDef(state)
  const nodeDefValidation = State.getValidation(state)
  const values = propExtractor ? propExtractor(nodeDef) : NodeDef.getPropAdvanced(propName, [])(nodeDef)

  // Radio logic (if enabled)
  const valuesDefined = !R.isEmpty(values)
  const [selectedRadioMode, setSelectedRadioMode] = useState(valuesDefined ? radioModes.defined : radioModes.none)
  useEffect(() => {
    setSelectedRadioMode(valuesDefined ? radioModes.defined : radioModes.none)
  }, [valuesDefined])

  const onChange = (expressions) =>
    onChangeProp ? onChangeProp(expressions) : Actions.setProp({ state, key: propName, value: expressions })

  const label = labelProp ? i18n.t(labelProp) : null

  return (
    <fieldset>
      <legend>{label}</legend>
      <div className="content">
        {radioMode && (
          <div className="form-item_body node-def-edit__expression-radio-mode">
            {Object.values(radioModes).map((rm) => (
              <Radiobox
                key={rm}
                checked={selectedRadioMode === rm}
                disabled={readOnly || (rm === radioModes.none && valuesDefined)}
                label={i18n.t(radioLabels[rm])}
                name={`radio-${qualifier}`}
                onChange={() => (valuesDefined ? undefined : setSelectedRadioMode(rm))}
                testId={TestId.expressionEditor.modeRadio(qualifier, rm)}
              />
            ))}
          </div>
        )}
        {(!radioMode || selectedRadioMode === radioModes.defined) && (
          <ExpressionsProp
            qualifier={qualifier}
            info={info}
            readOnly={readOnly}
            applyIf={applyIf}
            multiple={multiple}
            values={values}
            showLabels={showLabels}
            validation={Validation.getFieldValidation(propName)(nodeDefValidation)}
            mode={mode}
            onChange={onChange}
            nodeDefUuidContext={nodeDefUuidContext}
            nodeDefUuidCurrent={NodeDef.getUuid(nodeDef)}
            isContextParent={isContextParent}
            canBeConstant={canBeConstant}
            isBoolean={isBoolean}
            hideAdvanced={hideAdvanced}
            excludeCurrentNodeDef={excludeCurrentNodeDef}
            valueTypeSelection={valueTypeSelection}
            determineValueType={determineValueType}
            valueConstantEditorNumberFormat={valueConstantEditorNumberFormat}
          />
        )}
        {children}
      </div>
    </fieldset>
  )
}

NodeDefExpressionsProp.propTypes = {
  children: PropTypes.node,

  radioMode: PropTypes.bool,
  radioLabels: PropTypes.object,
  qualifier: PropTypes.string.isRequired, // used to generate test ids

  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
  onChange: PropTypes.func,

  nodeDefUuidContext: PropTypes.string,
  propName: PropTypes.string,
  propExtractor: PropTypes.func,
  info: PropTypes.string,
  label: PropTypes.string,
  mode: PropTypes.string,

  applyIf: PropTypes.bool,
  showLabels: PropTypes.bool,
  multiple: PropTypes.bool,
  readOnly: PropTypes.bool,

  isContextParent: PropTypes.bool,
  canBeConstant: PropTypes.bool,
  isBoolean: PropTypes.bool,
  hideAdvanced: PropTypes.bool,
  excludeCurrentNodeDef: PropTypes.bool,

  valueTypeSelection: PropTypes.bool,
  determineValueType: PropTypes.func,
  valueConstantEditorNumberFormat: PropTypes.object,
}

export default NodeDefExpressionsProp
