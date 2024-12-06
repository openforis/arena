import React from 'react'
import PropTypes from 'prop-types'

import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as ValidationResult from '@core/validation/validationResult'
import * as Expression from '@core/expressionParser/expression'

import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import ExpressionEditor from '@webapp/components/expression/expressionEditor'
import { ExpressionEditorType } from '@webapp/components/expression/expressionEditorType'
import { ButtonIconDelete } from '@webapp/components/buttons'
import ButtonGroup from '@webapp/components/form/buttonGroup'
import LabelsEditor from '@webapp/components/survey/LabelsEditor'
import ValidationTooltip from '@webapp/components/validationTooltip'

const ExpressionProp = (props) => {
  const {
    applyIf = true, // Show apply if expression editor
    canBeConstant = false,
    canBeCall = true,
    excludeCurrentNodeDef = true,
    expression,
    hideAdvanced = false,
    index,
    isBoolean = true,
    isContextParent = false,
    mode = Expression.modes.json,
    nodeDefUuidContext = null,
    nodeDefUuidCurrent = null,
    onUpdate = () => {},
    onDelete = () => {},
    qualifier,
    readOnly = false,
    severity = false, // Show severity (error/warning) button group
    showLabels = false, // Show error message labels editor
    validation = null,
  } = props

  const i18n = useI18n()

  const severityItems = Object.keys(ValidationResult.severity).map((severity) => ({
    key: severity,
    label: i18n.t(`common.${severity}`),
  }))

  const isPlaceholder = NodeDefExpression.isPlaceholder(expression)

  const expressionEditorTypes = [ExpressionEditorType.basic, ...(hideAdvanced ? [] : [ExpressionEditorType.advanced])]

  return (
    <ValidationTooltip validation={validation} showKeys={false}>
      <div className={`node-def-edit__expression${isPlaceholder ? ' placeholder' : ''}`}>
        {!isPlaceholder && !readOnly && (
          <ButtonIconDelete
            id={`expression-editor-${index}-${qualifier}-expression-btn-delete`}
            onClick={() => onDelete(expression)}
            testId={TestId.nodeDefDetails.expressionDeleteBtn(qualifier)}
          />
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
            canBeCall={canBeCall}
            canBeConstant={canBeConstant}
            isBoolean={isBoolean}
            types={expressionEditorTypes}
            mode={mode}
            readOnly={readOnly}
          />
        </div>

        {applyIf && !isPlaceholder && (
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
              canBeCall
              canBeConstant={false}
              readOnly={readOnly}
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
  canBeCall: PropTypes.bool,
  canBeConstant: PropTypes.bool,
  isBoolean: PropTypes.bool,
  hideAdvanced: PropTypes.bool,
  mode: PropTypes.oneOf([Expression.modes.json, Expression.modes.sql]),

  onUpdate: PropTypes.func,
  onDelete: PropTypes.func,
}

export default ExpressionProp
