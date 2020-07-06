import React from 'react'

import ValidationTooltip from '@webapp/components/validationTooltip'
import ExpressionEditor from '@webapp/components/expression/expressionEditor'
import { useI18n } from '@webapp/store/system'

import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as Validation from '@core/validation/validation'
import * as ValidationResult from '@core/validation/validationResult'
import * as Expression from '@core/expressionParser/expression'

import ButtonGroup from '@webapp/components/form/buttonGroup'
import LabelsEditor from '@webapp/components/survey/LabelsEditor'

const ExpressionProp = props => {
  const {
    nodeDefUuidContext,
    nodeDefUuidCurrent,
    validation,
    expression,
    applyIf,
    severity,
    showLabels,
    readOnly,
    isContextParent,
    canBeConstant,
    isBoolean,
    hideAdvanced,
    mode,
    onUpdate,
    onDelete,
  } = props

  const i18n = useI18n()

  const severityItems = [
    {
      key: ValidationResult.severity.error,
      label: i18n.t('common.error'),
    },
    {
      key: ValidationResult.severity.warning,
      label: i18n.t('common.warning'),
    },
  ]

  const isPlaceholder = NodeDefExpression.isPlaceholder(expression)

  return (
    <ValidationTooltip validation={validation} showKeys={false} type={Validation.isValid(validation) ? '' : 'error'}>
      <div className={`node-def-edit__expression${isPlaceholder ? ' placeholder' : ''}`}>
        {!isPlaceholder && (
          <button
            className="btn btn-s btn-transparent btn-delete"
            aria-disabled={readOnly}
            onClick={() => onDelete(expression)}
          >
            <span className="icon icon-bin2 icon-12px" />
          </button>
        )}

        <div className="expression-item">
          <div className="label">{i18n.t('nodeDefEdit.expressionsProp.expression')}</div>

          <ExpressionEditor
            nodeDefUuidContext={nodeDefUuidContext}
            nodeDefUuidCurrent={nodeDefUuidCurrent}
            query={NodeDefExpression.getExpression(expression)}
            onChange={expr => onUpdate(NodeDefExpression.assocExpression(expr)(expression))}
            isContextParent={isContextParent}
            canBeConstant={canBeConstant}
            isBoolean={isBoolean}
            hideAdvanced={hideAdvanced}
            mode={mode}
          />
        </div>

        {applyIf && (
          <div className="expression-item">
            <div className="label">{i18n.t('nodeDefEdit.expressionsProp.applyIf')}</div>

            <ExpressionEditor
              nodeDefUuidContext={nodeDefUuidContext}
              nodeDefUuidCurrent={nodeDefUuidCurrent}
              query={NodeDefExpression.getApplyIf(expression)}
              onChange={expr => onUpdate(NodeDefExpression.assocApplyIf(expr)(expression))}
              isContextParent={isContextParent}
              canBeConstant={false}
              hideAdvanced={true}
            />
          </div>
        )}
        {severity && (
          <div className="expression-item severity">
            <div className="label">{i18n.t('nodeDefEdit.expressionsProp.severity')}</div>

            <ButtonGroup
              selectedItemKey={NodeDefExpression.getSeverity(expression)}
              onChange={severityVal => onUpdate(NodeDefExpression.assocSeverity(severityVal)(expression))}
              items={severityItems}
              disabled={NodeDefExpression.isEmpty(expression)}
            />
          </div>
        )}
        {showLabels && (
          <LabelsEditor
            formLabelKey="common.errorMessage"
            labels={NodeDefExpression.getMessages(expression)}
            onChange={messages => onUpdate(NodeDefExpression.assocMessages(messages)(expression))}
            readOnly={NodeDefExpression.isEmpty(expression)}
          />
        )}
      </div>
    </ValidationTooltip>
  )
}

ExpressionProp.defaultProps = {
  nodeDefUuidContext: null,
  nodeDefUuidCurrent: null,
  validation: null,

  expression: '',
  applyIf: true, // Show apply if expression editor
  severity: false, // Show severity (error/warning) button group
  showLabels: false, // Show error message labels editor
  readOnly: false,

  isContextParent: false,
  canBeConstant: false,
  isBoolean: true,
  mode: Expression.modes.json,

  onUpdate: () => {},
  onDelete: () => {},
}

export default ExpressionProp
