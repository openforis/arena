import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { NodeDefCountType, NodeDefs } from '@openforis/arena-core/dist/nodeDef'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as Validation from '@core/validation/validation'

import { useSurvey } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import { TestId } from '@webapp/utils/testId'

import { FormItem } from '@webapp/components/form/Input'
import Checkbox from '@webapp/components/form/checkbox'
import ExpressionsProp from './ExpressionsProp'
import { State } from './store'
import ExpressionEditor from '@webapp/components/expression/expressionEditor'
import ValidationTooltip from '@webapp/components/validationTooltip'

const nodeDefValidationPropKeyByCountType = {
  [NodeDefCountType.max]: NodeDefValidations.keys.max,
  [NodeDefCountType.min]: NodeDefValidations.keys.min,
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

  const i18n = useI18n()

  return (
    <div className="form">
      {NodeDef.isMultiple(nodeDef) && (
        <>
          {[NodeDefCountType.min, NodeDefCountType.max].map((countType) => {
            const propKey = nodeDefValidationPropKeyByCountType[countType]
            const label = i18n.t(`nodeDefEdit.validationsProps.${propKey}Count`)
            const countValidation = R.pipe(
              Validation.getFieldValidation(NodeDef.keysPropsAdvanced.validations),
              Validation.getFieldValidation(propKey)
            )(validation)
            return (
              <FormItem key={countType} label={label}>
                <ValidationTooltip validation={countValidation} showKeys={false}>
                  <ExpressionEditor
                    canBeConstant
                    excludeCurrentNodeDef
                    nodeDefUuidContext={nodeDefUuidContext}
                    nodeDefUuidCurrent={NodeDef.getUuid(nodeDef)}
                    onChange={({ query, callback }) => {
                      onValidationsUpdate(NodeDefValidations.assocCountProp(propKey)(query)(nodeDefValidations))
                      callback()
                    }}
                    query={NodeDefs.getCount(nodeDef, countType)}
                    qualifier={propKey}
                  />
                </ValidationTooltip>
              </FormItem>
            )
          })}
        </>
      )}
      {NodeDef.isSingle(nodeDef) && !NodeDef.isKey(nodeDef) && (
        <FormItem label={i18n.t('common.required')}>
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
          <FormItem label={i18n.t('common.unique')}>
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
          label={i18n.t('nodeDefEdit.validationsProps.expressions')}
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
