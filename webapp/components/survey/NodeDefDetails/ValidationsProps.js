import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as Validation from '@core/validation/validation'

import { useSurvey } from '@webapp/store/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import { TestId } from '@webapp/utils/testId'

import { FormItem, Input, NumberFormats } from '@webapp/components/form/Input'
import Checkbox from '@webapp/components/form/checkbox'
import ExpressionsProp, { NodeDefExpressionsProp } from './ExpressionsProp'
import { State } from './store'
import { Objects } from '@openforis/arena-core'

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

  const countPropExtractor = (countType) => (nodeDef) => {
    const minCount = R.pipe(
      NodeDef.getValidations,
      countType === NodeDefValidations.keys.min ? NodeDefValidations.getMinCount : NodeDefValidations.getMaxCount
    )(nodeDef)
    if (Objects.isEmpty(minCount)) return []
    if (Array.isArray(minCount)) return minCount
    return [NodeDefExpression.createExpression({ expression: minCount })]
  }

  return (
    <div className="form">
      {NodeDef.isMultiple(nodeDef) && (
        <>
          <NodeDefExpressionsProp
            qualifier={TestId.nodeDefDetails.minCount}
            state={state}
            Actions={Actions}
            isBoolean={false}
            label="nodeDefEdit.validationsProps.minCount"
            onChange={(expressions) => {
              let validationsUpdated = NodeDef.getValidations(nodeDef)
              validationsUpdated = NodeDefValidations.assocMinCount(
                R.reject(NodeDefExpression.isPlaceholder, expressions)
              )(validationsUpdated)

              Actions.setProp({
                state,
                key: NodeDef.keysPropsAdvanced.validations,
                value: validationsUpdated,
              })
            }}
            readOnly={readOnly}
            propExtractor={countPropExtractor(NodeDefValidations.keys.min)}
            nodeDefUuidContext={nodeDefUuidContext}
            canBeConstant
            excludeCurrentNodeDef
          />
          {/* <Input
            value={NodeDefValidations.getMinCount(nodeDefValidations)}
            disabled={readOnly}
            validation={R.pipe(
              Validation.getFieldValidation(NodeDef.keysPropsAdvanced.validations),
              Validation.getFieldValidation(NodeDefValidations.keys.min)
            )(validation)}
            numberFormat={NumberFormats.integer()}
            onChange={(value) => onValidationsUpdate(NodeDefValidations.assocMinCount(value)(nodeDefValidations))}
          /> */}
          <FormItem label="nodeDefEdit.validationsProps.maxCount">
            <Input
              value={NodeDefValidations.getMaxCount(nodeDefValidations)}
              disabled={readOnly}
              validation={R.pipe(
                Validation.getFieldValidation(NodeDef.keysPropsAdvanced.validations),
                Validation.getFieldValidation(NodeDefValidations.keys.max)
              )(validation)}
              numberFormat={NumberFormats.integer()}
              onChange={(value) => onValidationsUpdate(NodeDefValidations.assocMaxCount(value)(nodeDefValidations))}
            />
          </FormItem>
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
