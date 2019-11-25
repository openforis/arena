import React from 'react'

import ValidationTooltip from '@webapp/commonComponents/validationTooltip'
import ExpressionEditor from '@webapp/commonComponents/expression/expressionEditor'
import LabelsEditor from '../../../labelsEditor/labelsEditor'
import { useI18n } from '@webapp/commonComponents/hooks'

import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as Validation from '@core/validation/validation'
import * as ValidationResult from '@core/validation/validationResult'
import ButtonGroup from '@webapp/commonComponents/form/buttonGroup'

const ExpressionProp = (props) => {

  const {
    nodeDefUuidContext, nodeDefUuidCurrent, validation,
    expression, applyIf, severity, showLabels, readOnly,
    isContextParent, canBeConstant, isBoolean,
    onUpdate, onDelete,
  } = props

  const i18n = useI18n()

  const severityItems = [
    {
      key: ValidationResult.severity.error,
      label: i18n.t('common.error')
    },
    {
      key: ValidationResult.severity.warning,
      label: i18n.t('common.warning')
    }
  ]

  const isPlaceholder = NodeDefExpression.isPlaceholder(expression)

  return (
    <ValidationTooltip
      validation={validation}
      showKeys={false}
      type={Validation.isValid(validation) ? '' : 'error'}>

      <div className={`node-def-edit__expression${isPlaceholder ? ' placeholder' : ''}`}>

        {
          !isPlaceholder &&
          <button className="btn btn-s btn-transparent btn-delete"
                  aria-disabled={readOnly}
                  onClick={() => onDelete(expression)}>
            <span className="icon icon-bin2 icon-12px"/>
          </button>
        }

        <div className="expression-item">
          <div className="label">{i18n.t('nodeDefEdit.expressionsProp.expression')}</div>

          <ExpressionEditor
            nodeDefUuidContext={nodeDefUuidContext}
            nodeDefUuidCurrent={nodeDefUuidCurrent}
            query={NodeDefExpression.getExpression(expression)}
            onChange={expr =>
              onUpdate(NodeDefExpression.assocExpression(expr)(expression))
            }
            isContextParent={isContextParent}
            canBeConstant={canBeConstant}
            isBoolean={isBoolean}/>
        </div>

        {
          applyIf &&
          <div className="expression-item">
            <div className="label">{i18n.t('nodeDefEdit.expressionsProp.applyIf')}</div>

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
        }
        {
          severity &&
          <div className="expression-item severity">
            <div className="label">{i18n.t('nodeDefEdit.expressionsProp.severity')}</div>

            <ButtonGroup
              selectedItemKey={NodeDefExpression.getSeverity(expression)}
              onChange={severityVal =>
                onUpdate(NodeDefExpression.assocSeverity(severityVal)(expression))
              }
              items={severityItems}
              disabled={NodeDefExpression.isEmpty(expression)}
            />
          </div>
        }
        {
          showLabels &&
          <LabelsEditor
            formLabelKey="common.errorMessage"
            labels={NodeDefExpression.getMessages(expression)}
            onChange={messages =>
              onUpdate(NodeDefExpression.assocMessages(messages)(expression))
            }
            readOnly={NodeDefExpression.isEmpty(expression)}
          />
        }
      </div>
    </ValidationTooltip>
  )
}

ExpressionProp.defaultProps = {
  nodeDefUuidContext: null,
  nodeDefUuidCurrent: null,
  validation: null,

  expression: '',
  applyIf: true, //show apply if expression editor
  severity: false, //show severity (error/warning) button group
  showLabels: false, //show error message labels editor
  readOnly: false,

  isContextParent: false,
  canBeConstant: false,
  isBoolean: true,

  onUpdate: () => {},
  onDelete: () => {},
}

export default ExpressionProp