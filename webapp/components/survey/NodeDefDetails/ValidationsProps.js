import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { Objects } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as Validation from '@core/validation/validation'

import { useSurvey } from '@webapp/store/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import { TestId } from '@webapp/utils/testId'

import { FormItem, NumberFormats } from '@webapp/components/form/Input'
import Checkbox from '@webapp/components/form/checkbox'

import ExpressionsProp, { NodeDefExpressionsProp, ValueType } from './ExpressionsProp'
import { State } from './store'

const countTypes = [NodeDefValidations.keys.min, NodeDefValidations.keys.max]

const countPropNumberFormat = NumberFormats.integer({ allowNegative: false })

const CountProp = (props) => {
  const { Actions, countType, nodeDef, nodeDefUuidContext, readOnly, state } = props

  const countPropExtractor = (countType) => (nodeDef) => {
    const count = R.pipe(NodeDef.getValidations, NodeDefValidations.getCountProp(countType))(nodeDef)
    if (Objects.isEmpty(count)) return []
    if (Array.isArray(count)) return count
    return [NodeDefExpression.createExpression({ expression: count })]
  }

  const onChange = (value) => {
    const valueUpdated = Array.isArray(value) ? R.reject(NodeDefExpression.isPlaceholder, value) : value
    const validations = NodeDef.getValidations(nodeDef)
    const validationsUpdated = NodeDefValidations.assocCountProp(countType)(valueUpdated)(validations)
    Actions.setProp({
      state,
      key: NodeDef.keysPropsAdvanced.validations,
      value: validationsUpdated,
    })
  }

  const determineValueType = useCallback(() => {
    const count = R.pipe(NodeDef.getValidations, NodeDefValidations.getCountProp(countType))(nodeDef)
    return Objects.isEmpty(count) || !Array.isArray(count) ? ValueType.constant : ValueType.expression
  }, [countType, nodeDef])

  return (
    <div>
      <NodeDefExpressionsProp
        qualifier={TestId.nodeDefDetails[`${countType}Count`]}
        state={state}
        Actions={Actions}
        isBoolean={false}
        label={`nodeDefEdit.validationsProps.${countType}Count`}
        onChange={onChange}
        readOnly={readOnly}
        propName={`validations.${countType}`}
        propExtractor={countPropExtractor(countType)}
        nodeDefUuidContext={nodeDefUuidContext}
        canBeConstant
        excludeCurrentNodeDef
        valueTypeSelection
        determineValueType={determineValueType}
        valueConstantEditorNumberFormat={countPropNumberFormat}
      />
    </div>
  )
}

CountProp.propTypes = {
  Actions: PropTypes.object.isRequired,
  countType: PropTypes.string.isRequired,
  nodeDef: PropTypes.object.isRequired,
  nodeDefUuidContext: PropTypes.string.isRequired,
  readOnly: PropTypes.bool,
  state: PropTypes.object.isRequired,
}

const ValidationsProps = (props) => {
  const { state, Actions } = props

  const readOnly = !useAuthCanEditSurvey()
  const survey = useSurvey()

  const nodeDef = State.getNodeDef(state)
  const validation = State.getValidation(state)
  const nodeDefValidations = NodeDef.getValidations(nodeDef)
  const nodeDefUuidContext = NodeDef.getParentUuid(nodeDef)
  const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)

  const onValidationsUpdate = (validations) =>
    Actions.setProp({ state, key: NodeDef.keysPropsAdvanced.validations, value: validations })

  return (
    <div className="form">
      {NodeDef.isMultiple(nodeDef) && (
        <>
          {countTypes.map((countType) => (
            <CountProp
              key={countType}
              Actions={Actions}
              countType={countType}
              nodeDef={nodeDef}
              nodeDefUuidContext={nodeDefUuidContext}
              readOnly={readOnly}
              state={state}
            />
          ))}
        </>
      )}
      {NodeDef.isSingle(nodeDef) && !NodeDef.isKey(nodeDef) && (
        <FormItem label="common.required">
          <Checkbox
            checked={NodeDefValidations.isRequired(nodeDefValidations)}
            disabled={readOnly}
            onChange={(checked) => onValidationsUpdate(NodeDefValidations.assocRequired(checked)(nodeDefValidations))}
          />
        </FormItem>
      )}
      {NodeDef.isAttribute(nodeDef) &&
        !NodeDef.isKey(nodeDef) &&
        (NodeDef.isRoot(nodeDefParent) || NodeDef.isMultiple(nodeDefParent) || NodeDef.isMultiple(nodeDef)) && (
          <FormItem isInfoMarkdown info="nodeDefEdit.unique.info" label="nodeDefEdit.unique.label">
            <Checkbox
              id={TestId.nodeDefDetails.nodeDefUnique}
              checked={NodeDefValidations.isUnique(nodeDefValidations)}
              disabled={readOnly}
              onChange={(checked) => onValidationsUpdate(NodeDefValidations.assocUnique(checked)(nodeDefValidations))}
            />
          </FormItem>
        )}
      {NodeDef.isAttribute(nodeDef) && (
        <ExpressionsProp
          qualifier={TestId.nodeDefDetails.validations}
          label="nodeDefEdit.validationsProps.expressions"
          readOnly={readOnly}
          applyIf
          showLabels
          severity
          values={NodeDefValidations.getExpressions(nodeDefValidations)}
          validation={R.pipe(
            Validation.getFieldValidation(NodeDef.keysPropsAdvanced.validations),
            Validation.getFieldValidation(NodeDefValidations.keys.expressions)
          )(validation)}
          onChange={(expressions) =>
            onValidationsUpdate(NodeDefValidations.assocExpressions(expressions)(nodeDefValidations))
          }
          nodeDefUuidContext={nodeDefUuidContext}
          nodeDefUuidCurrent={NodeDef.getUuid(nodeDef)}
          excludeCurrentNodeDef={false}
        />
      )}
    </div>
  )
}

ValidationsProps.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default ValidationsProps
