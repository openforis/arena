import React from 'react'
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

import { FormItem } from '@webapp/components/form/Input'
import Checkbox from '@webapp/components/form/checkbox'
import ExpressionsProp, { NodeDefExpressionsProp } from './ExpressionsProp'
import { State } from './store'

const countTypes = [NodeDefValidations.keys.min, NodeDefValidations.keys.max]

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
    const count = R.pipe(NodeDef.getValidations, NodeDefValidations.getCountProp(countType))(nodeDef)
    if (Objects.isEmpty(count)) return []
    if (Array.isArray(count)) return count
    return [NodeDefExpression.createExpression({ expression: count })]
  }

  const onValidationUpdate = (validationsUpdateFn) => {
    const validationsUpdated = validationsUpdateFn(NodeDef.getValidations(nodeDef))
    Actions.setProp({
      state,
      key: NodeDef.keysPropsAdvanced.validations,
      value: validationsUpdated,
    })
  }

  return (
    <div className="form">
      {NodeDef.isMultiple(nodeDef) && (
        <>
          {countTypes.map((countType) => (
            <NodeDefExpressionsProp
              key={countType}
              qualifier={TestId.nodeDefDetails[`${countType}Count`]}
              state={state}
              Actions={Actions}
              isBoolean={false}
              label={`nodeDefEdit.validationsProps.${countType}Count`}
              onChange={(expressions) => {
                onValidationUpdate(
                  NodeDefValidations.assocCountProp(countType)(R.reject(NodeDefExpression.isPlaceholder, expressions))
                )
              }}
              readOnly={readOnly}
              propExtractor={countPropExtractor(countType)}
              nodeDefUuidContext={nodeDefUuidContext}
              canBeConstant
              excludeCurrentNodeDef
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
