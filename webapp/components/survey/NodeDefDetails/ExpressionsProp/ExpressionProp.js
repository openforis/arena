import React from 'react'
import PropTypes from 'prop-types'

import * as Expression from '@core/expressionParser/expression'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as ValidationResult from '@core/validation/validationResult'

import ExpressionEditor from '@webapp/components/expression/expressionEditor'
import { ExpressionEditorType } from '@webapp/components/expression/expressionEditorType'
import ButtonGroup from '@webapp/components/form/buttonGroup'
import LabelsEditor from '@webapp/components/survey/LabelsEditor'
import ValidationTooltip from '@webapp/components/validationTooltip'
import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

const ExpressionProp = (props) => {
  const {
    qualifier,
    index,
    nodeDefUuidContext,
    nodeDefUuidCurrent,
    excludeCurrentNodeDef,
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

  const expressionEditorTypes = [ExpressionEditorType.basic, ...(hideAdvanced ? [] : [ExpressionEditorType.advanced])]

  return (
    <ValidationTooltip validation={validation} showKeys={false}>
      <div className={`node-def-edit__expression${isPlaceholder ? ' placeholder' : ''}`}>
        {!isPlaceholder && (
          <button
            data-testid={TestId.nodeDefDetails.expressionDeleteBtn(qualifier)}
            id={`expression-editor-${index}-${qualifier}-expression-btn-delete`}
            type="button"
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
            index={index}
            placeholder={isPlaceholder}
            qualifier={qualifier}
            nodeDefUuidContext={nodeDefUuidContext}
            nodeDefUuidCurrent={nodeDefUuidCurrent}
            excludeCurrentNodeDef={excludeCurrentNodeDef}
            query={NodeDefExpression.getExpression(expression)}
            onChange={({ query, callback }) => onUpdate(NodeDefExpression.assocExpression(query)(expression), callback)}
            isContextParent={isContextParent}
            canBeConstant={canBeConstant}
            isBoolean={isBoolean}
            types={expressionEditorTypes}
            mode={mode}
          />
        </div>

        {applyIf && (
          <div className="expression-item">
            <div className="label">{i18n.t('nodeDefEdit.expressionsProp.applyIf')}</div>

            <ExpressionEditor
              index={index}
              placeholder={isPlaceholder}
              qualifier={TestId.nodeDefDetails.applyIf(qualifier)}
              nodeDefUuidContext={nodeDefUuidContext}
              nodeDefUuidCurrent={nodeDefUuidCurrent}
              excludeCurrentNodeDef={excludeCurrentNodeDef}
              query={NodeDefExpression.getApplyIf(expression)}
              onChange={({ query, callback }) => onUpdate(NodeDefExpression.assocApplyIf(query)(expression), callback)}
              isContextParent={isContextParent}
              canBeConstant={false}
              types={expressionEditorTypes}
            />
          </div>
        )}
        {severity && (
          <div className="expression-item severity">
            <div className="label">{i18n.t('nodeDefEdit.expressionsProp.severity')}</div>

            <ButtonGroup
              selectedItemKey={NodeDefExpression.getSeverity(expression)}
              onChange={(severityVal) => onUpdate(NodeDefExpression.assocSeverity(severityVal)(expression))}
              items={severityItems}
              disabled={NodeDefExpression.isEmpty(expression)}
            />
          </div>
        )}
        {showLabels && (
          <LabelsEditor
            formLabelKey="common.errorMessage"
            labels={NodeDefExpression.getMessages(expression)}
            onChange={(messages) => onUpdate(NodeDefExpression.assocMessages(messages)(expression))}
            readOnly={NodeDefExpression.isEmpty(expression)}
          />
        )}
      </div>
    </ValidationTooltip>
  )
}

ExpressionProp.propTypes = {
  index: PropTypes.number.isRequired, // used to generate test ids
  qualifier: PropTypes.string.isRequired, // used to generate test ids

  nodeDefUuidContext: PropTypes.string,
  nodeDefUuidCurrent: PropTypes.string,
  excludeCurrentNodeDef: PropTypes.bool,
  validation: PropTypes.object,

  expression: PropTypes.object.isRequired,
  applyIf: PropTypes.bool,
  severity: PropTypes.bool,
  showLabels: PropTypes.bool,
  readOnly: PropTypes.bool,

  isContextParent: PropTypes.bool,
  canBeConstant: PropTypes.bool,
  isBoolean: PropTypes.bool,
  hideAdvanced: PropTypes.bool,
  mode: PropTypes.oneOf([Expression.modes.json, Expression.modes.sql]),

  onUpdate: PropTypes.func,
  onDelete: PropTypes.func,
}

ExpressionProp.defaultProps = {
  nodeDefUuidContext: null,
  nodeDefUuidCurrent: null,
  excludeCurrentNodeDef: true,
  validation: null,

  applyIf: true, // Show apply if expression editor
  severity: false, // Show severity (error/warning) button group
  showLabels: false, // Show error message labels editor
  readOnly: false,

  isContextParent: false,
  canBeConstant: false,
  isBoolean: true,
  hideAdvanced: false,
  mode: Expression.modes.json,

  onUpdate: () => {},
  onDelete: () => {},
}

export default ExpressionProp
