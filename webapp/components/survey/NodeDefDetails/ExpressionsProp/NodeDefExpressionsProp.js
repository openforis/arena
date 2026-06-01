import React, { useCallback, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import * as NodeDef from '@core/survey/nodeDef'
import * as Validation from '@core/validation/validation'
import * as Expression from '@core/expressionParser/expression'

import ExpressionsProp from './ExpressionsProp'
import { Fieldset } from '@webapp/components/Fieldset'
import Radiobox from '@webapp/components/form/radiobox'
import { TestId } from '@webapp/utils/testId'

import { State } from '../store'

const defaultRadioModes = {
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
    label = '',
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
    radioModes = Object.values(defaultRadioModes),
    radioModeDefined = defaultRadioModes.defined,
    radioLabels = { none: 'common.none', defined: 'common.defined' },
    determineRadioMode = null,
    onRadioModeChange = null,
    isRadioModeDisabled = null,
  } = props

  const nodeDef = useMemo(() => State.getNodeDef(state), [state])
  const nodeDefValidation = State.getValidation(state)
  const values = propExtractor ? propExtractor(nodeDef) : NodeDef.getPropAdvanced(propName, [])(nodeDef)

  // Radio logic (if enabled)
  const valuesDefined = !R.isEmpty(values)
  const getSelectedRadioMode = useCallback(() => {
    if (determineRadioMode) {
      return determineRadioMode({ nodeDef, values, valuesDefined })
    }
    if (valuesDefined) {
      return defaultRadioModes.defined
    }
    return defaultRadioModes.none
  }, [determineRadioMode, nodeDef, values, valuesDefined])

  const [manualRadioMode, setManualRadioMode] = useState(null)
  const selectedRadioMode = useMemo(
    () => manualRadioMode ?? getSelectedRadioMode(),
    [manualRadioMode, getSelectedRadioMode]
  )

  const onChange = useCallback(
    (expressions) => {
      setManualRadioMode(null)
      if (onChangeProp) {
        onChangeProp(expressions)
      } else {
        Actions.setProp({ state, key: propName, value: expressions })
      }
    },
    [Actions, onChangeProp, propName, state]
  )

  return (
    <Fieldset className="node-def-edit__expressions-fieldset" info={info} legend={label}>
      <div className="content">
        {radioMode && (
          <div className="form-item_body node-def-edit__expression-radio-mode">
            {radioModes.map((rm) => {
              const modeDisabled = isRadioModeDisabled
                ? isRadioModeDisabled({ mode: rm, readOnly, valuesDefined, selectedRadioMode })
                : readOnly || (rm === defaultRadioModes.none && valuesDefined)

              return (
                <Radiobox
                  key={rm}
                  checked={selectedRadioMode === rm}
                  disabled={modeDisabled}
                  label={radioLabels[rm]}
                  name={`radio-${qualifier}`}
                  onChange={() => {
                    if (modeDisabled) return
                    onRadioModeChange?.(rm)
                    setManualRadioMode(rm)
                  }}
                  testId={TestId.expressionEditor.modeRadio(qualifier, rm)}
                />
              )
            })}
          </div>
        )}
        {(!radioMode || selectedRadioMode === radioModeDefined) && (
          <ExpressionsProp
            qualifier={qualifier}
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
    </Fieldset>
  )
}

NodeDefExpressionsProp.propTypes = {
  children: PropTypes.node,

  radioMode: PropTypes.bool,
  radioModes: PropTypes.array,
  radioModeDefined: PropTypes.string,
  radioLabels: PropTypes.object,
  determineRadioMode: PropTypes.func,
  onRadioModeChange: PropTypes.func,
  isRadioModeDisabled: PropTypes.func,
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
