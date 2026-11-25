import { useCallback, useMemo, useState, type ReactNode } from 'react'
import * as A from '@core/arena'

import * as NodeDef from '@core/survey/nodeDef'
import * as Validation from '@core/validation/validation'
import * as Expression from '@core/expressionParser/expression'

import ExpressionsProp, { type ExpressionsPropProps } from './ExpressionsProp'
import { Fieldset } from '@webapp/components/Fieldset'
import Radiobox from '@webapp/components/form/Radiobox'
import { TestId } from '@webapp/utils/testId'

import { State } from '../store'

const defaultRadioModes = {
  none: 'none',
  defined: 'defined',
}

// the expressions editor props, but values, validation and current node def are taken from the node def being edited
type NodeDefExpressionsPropProps = Omit<
  ExpressionsPropProps,
  'values' | 'validation' | 'nodeDefUuidCurrent' | 'onChange'
> & {
  children?: ReactNode
  radioMode?: boolean
  radioModes?: any[]
  radioModeDefined?: string
  radioLabels?: Record<string, any>
  determineRadioMode?: (...args: any[]) => any
  onRadioModeChange?: (...args: any[]) => any
  isRadioModeDisabled?: (...args: any[]) => any
  state: Record<string, any>
  Actions: Record<string, any>
  onChange?: (...args: any[]) => any
  propName?: string
  propExtractor?: (...args: any[]) => any
}

const NodeDefExpressionsProp = (props: NodeDefExpressionsPropProps) => {
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
    severity = false,
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
  const valuesDefined = !A.isEmpty(values)
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
            severity={severity}
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

export default NodeDefExpressionsProp
