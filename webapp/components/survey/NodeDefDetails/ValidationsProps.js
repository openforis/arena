import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as Validation from '@core/validation/validation'

import { useSurvey } from '@webapp/store/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import { TestId } from '@webapp/utils/testId'

import { FormItem, Input, NumberFormats } from '@webapp/components/form/Input'
import Checkbox from '@webapp/components/form/checkbox'
import ExpressionsProp from './ExpressionsProp'
import { State } from './store'

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
          <FormItem label="nodeDefEdit.validationsProps.minCount">
            <Input
              value={NodeDefValidations.getMinCount(nodeDefValidations)}
              disabled={readOnly}
              validation={R.pipe(
                Validation.getFieldValidation(NodeDef.keysPropsAdvanced.validations),
                Validation.getFieldValidation(NodeDefValidations.keys.min)
              )(validation)}
              numberFormat={NumberFormats.integer()}
              onChange={(value) => onValidationsUpdate(NodeDefValidations.assocMinCount(value)(nodeDefValidations))}
            />
          </FormItem>
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
