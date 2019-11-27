import React from 'react'
import * as R from 'ramda'

import Tooltip from '@webapp/commonComponents/tooltip'
import ExpressionEditor from '@webapp/commonComponents/expression/expressionEditor'
import {useI18n} from '@webapp/commonComponents/hooks'

import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as ValidationResult from '@core/validation/validationResult'
import * as ValidationUtils from '@webapp/utils/validationUtils'
import ButtonGroup from '@webapp/commonComponents/form/buttonGroup'
import LabelsEditor from '../../../labelsEditor/labelsEditor'

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
    onUpdate,
    onDelete,
  } = props

  const i18n = useI18n()

  const severityItems = [
    {
      key: ValidationResult.severities.error,
      label: i18n.t('common.error'),
    },
    {
      key: ValidationResult.severities.warning,
      label: i18n.t('common.warning'),
    },
  ]

  const errorMessages = ValidationUtils.getValidationFieldMessages(
    i18n,
    false,
  )(validation)

  const isPlaceholder = NodeDefExpression.isPlaceholder(expression)

  return (
    <Tooltip
      messages={errorMessages}
      position="bottom"
      type={!R.isEmpty(errorMessages) ? 'error' : ''}
    >
      <div
        className={`node-def-edit__expression${
          isPlaceholder ? ' placeholder' : ''
        }`}
      >
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
          <div className="label">
            {i18n.t('nodeDefEdit.expressionsProp.expression')}
          </div>

          <ExpressionEditor
            nodeDefUuidContext={nodeDefUuidContext}
            nodeDefUuidCurrent={nodeDefUuidCurrent}
            query={NodeDefExpression.getExpression(expression)}
            onChange={expr =>
              onUpdate(NodeDefExpression.assocExpression(expr)(expression))
            }
            isContextParent={isContextParent}
            canBeConstant={canBeConstant}
            isBoolean={isBoolean}
          />
        </div>

        {applyIf && (
          <div className="expression-item">
            <div className="label">
              {i18n.t('nodeDefEdit.expressionsProp.applyIf')}
            </div>

            <ExpressionEditor
              nodeDefUuidContext={nodeDefUuidContext}
              nodeDefUuidCurrent={nodeDefUuidCurrent}
              query={NodeDefExpression.getApplyIf(expression)}
              onChange={expr =>
                onUpdate(NodeDefExpression.assocApplyIf(expr)(expression))
              }
              isContextParent={isContextParent}
              canBeConstant={false}
            />
          </div>
        )}
        {severity && (
          <div className="expression-item severity">
            <div className="label">
              {i18n.t('nodeDefEdit.expressionsProp.severity')}
            </div>

            <ButtonGroup
              selectedItemKey={NodeDefExpression.getSeverity(expression)}
              onChange={severityVal =>
                onUpdate(
                  NodeDefExpression.assocSeverity(severityVal)(expression),
                )
              }
              items={severityItems}
              disabled={NodeDefExpression.isEmpty(expression)}
            />
          </div>
        )}
        {showLabels && (
          <LabelsEditor
            formLabelKey="common.errorMessage"
            labels={NodeDefExpression.getMessages(expression)}
            onChange={messages =>
              onUpdate(NodeDefExpression.assocMessages(messages)(expression))
            }
            readOnly={NodeDefExpression.isEmpty(expression)}
          />
        )}
      </div>
    </Tooltip>
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

  onUpdate: () => {},
  onDelete: () => {},
}

export default ExpressionProp
