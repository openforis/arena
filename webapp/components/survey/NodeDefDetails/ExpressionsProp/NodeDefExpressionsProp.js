import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as Validation from '@core/validation/validation'
import * as Expression from '@core/expressionParser/expression'

import ExpressionsProp from './ExpressionsProp'
import Radiobox from '@webapp/components/form/radiobox'

import { State } from '../store'
import { useI18n } from '@webapp/store/system'

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
    radioLabels = { none: 'None', defined: 'Define' },
  } = props

  const i18n = useI18n()

  const nodeDef = State.getNodeDef(state)
  const nodeDefValidation = State.getValidation(state)
  const values = propExtractor ? propExtractor(nodeDef) : NodeDef.getPropAdvanced(propName, [])(nodeDef)

  // Radio logic (if enabled)
  const defined = !R.isEmpty(values)
  const [modeRadio, setModeRadio] = React.useState(defined ? 'defined' : 'none')
  React.useEffect(() => {
    setModeRadio(defined ? 'defined' : 'none')
  }, [defined])

  const onChange = (expressions) =>
    onChangeProp
      ? onChangeProp(expressions)
      : Actions.setProp({ state, key: propName, value: R.reject(NodeDefExpression.isPlaceholder, expressions) })

  const label = labelProp ? i18n.t(labelProp) : null

  return (
    <fieldset>
      <legend>{label}</legend>
      <div className="content">
        {radioMode && (
          <div
            className="form-item_body"
            style={{ display: 'flex', flexDirection: 'row', gap: '1em', marginBottom: '0.5em' }}
          >
            <Radiobox
              name={`radio-${qualifier}`}
              checked={modeRadio === 'none'}
              onChange={() => {
                setModeRadio('none')
                if (defined) onChange([])
              }}
              label={i18n.t(radioLabels.none)}
              data-testid={`${qualifier}-none-radio`}
              disabled={readOnly}
            />
            <Radiobox
              name={`radio-${qualifier}`}
              checked={modeRadio === 'defined'}
              onChange={() => setModeRadio('defined')}
              label={i18n.t(radioLabels.defined)}
              data-testid={`${qualifier}-define-radio`}
              disabled={readOnly}
            />
          </div>
        )}
        {(!radioMode || modeRadio === 'defined') && (
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
