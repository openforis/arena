import './ExpressionsProp.scss'

import { type ReactNode, useCallback, useMemo, useState } from 'react'
import classNames from 'classnames'

import { type ArenaValidation, Objects } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as Expression from '@core/expressionParser/expression'
import * as StringUtils from '@core/stringUtils'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as Validation from '@core/validation/validation'
import { isAiFeatureShown, isAiFeatureUsable } from '@webapp/ai/policy/aiFeatureAvailability'
import AiExpressionPopup from '@webapp/components/ai/AiExpressionPopup'
import { AiPolicyBlockedTooltip } from '@webapp/components/ai/AiPolicyBlockedTooltip'
import ButtonAiGenerateExpression from '@webapp/components/ai/ButtonAiGenerateExpression'
import { useAiFeatureAvailability } from '@webapp/components/ai/hooks/useAiFeatureAvailability'
import { ButtonNew } from '@webapp/components/buttons'
import { ButtonGroup } from '@webapp/components/form'
import { FormItem, Input } from '@webapp/components/form/Input'
import { useConfirmAsync } from '@webapp/components/hooks'
import ValidationTooltip from '@webapp/components/ValidationTooltip'
import { useAppDispatch } from '@webapp/store'
import { DialogConfirmActions } from '@webapp/store/ui'
import { TestId } from '@webapp/utils/testId'

import ExpressionProp from './ExpressionProp'
import type { ExpressionEditorSettingsProps } from './expressionPropTypes'

export const ValueType = {
  constant: 'constant',
  expression: 'expression',
}

const valueTypeItems = Object.keys(ValueType).map((valueType) => ({
  key: valueType,
  label: `expressionEditor.valueType.${valueType}`,
}))

const extractConstantValue = ({ values }) => {
  const nodeDefExpr = values[0]
  if (
    NodeDefExpression.isPlaceholder(nodeDefExpr) ||
    NodeDefExpression.isExpressionEmpty(nodeDefExpr) ||
    !NodeDefExpression.isApplyIfEmpty(nodeDefExpr)
  ) {
    return null
  }
  const expression = NodeDefExpression.getExpression(nodeDefExpr)
  const stringValue = typeof expression === 'string' ? expression : null
  return Expression.isLiteral(Expression.fromString(stringValue))
    ? A.pipe(StringUtils.unquote, StringUtils.unquoteDouble)(stringValue)
    : null
}

type ExpressionsWrapperProps = {
  validation?: ArenaValidation
  children?: ReactNode
}

const ExpressionsWrapper = (props: ExpressionsWrapperProps) => {
  const { validation, children } = props

  const hasFieldValidations = Objects.isNotEmpty(Validation.getFieldValidations(validation))
  const className = 'node-def-edit__expressions-wrapper'

  return hasFieldValidations ? (
    <div className={className}>{children}</div>
  ) : (
    <ValidationTooltip className={className} validation={validation}>
      {children}
    </ValidationTooltip>
  )
}

export type ExpressionsPropProps = ExpressionEditorSettingsProps & {
  determineValueType?: (...args: any[]) => any
  info?: string
  label?: string
  multiple?: boolean
  onChange: (...args: any[]) => any
  values?: any[] // Array of expressions
  valueTypeSelection?: boolean
  valueConstantEditorNumberFormat?: Record<string, any>
}

const ExpressionsProp = (props: ExpressionsPropProps) => {
  const {
    applyIf = true,
    canBeConstant = false,
    determineValueType = null,
    excludeCurrentNodeDef = true,
    hideAdvanced = false,
    isBoolean = true,
    isContextParent = false,
    info = null,
    label = '',
    mode = Expression.modes.json,
    multiple = true,
    nodeDefUuidContext = null,
    nodeDefUuidCurrent = null,
    onChange,
    qualifier,
    readOnly = false,
    severity = false,
    showLabels = false,
    validation = null,
    values = [],
    valueTypeSelection = false,
    valueConstantEditorNumberFormat = null,
  } = props

  const dispatch = useAppDispatch()
  const confirm = useConfirmAsync()
  const aiGenerate = useAiFeatureAvailability('expressionGenerate')

  const [valueType, setValueType] = useState(determineValueType?.())
  const [expressionPlaceholder, setExpressionPlaceholder] = useState(null)
  const [aiOpen, setAiOpen] = useState(false)

  const valuesIsEmpty = A.isEmpty(values) || values.every(NodeDefExpression.isEmpty)

  const onValueTypeChange = useCallback(
    async (valueTypeNext) => {
      if (valueTypeNext === ValueType.expression) {
        // switch from constant to expression: convert constant value (if specified) to expression
        const constantValue = values?.[0]?.expression
        if (Objects.isNotEmpty(constantValue)) {
          onChange([NodeDefExpression.createExpression({ expression: constantValue })])
        }
        setValueType(valueTypeNext)
      } else if (valuesIsEmpty) {
        // converting from expression to constant
        // no expressions to convert; just switch type
        setValueType(valueTypeNext)
      } else {
        // converting from expression to constant
        // expressions defined: try to convert them into a constant value
        const constantValue = extractConstantValue({ values })
        if (!Objects.isEmpty(constantValue)) {
          onChange(constantValue)
          setValueType(valueTypeNext)
        } else if (await confirm({ key: 'nodeDefEdit:expressionsProp.confirmDelete' })) {
          // expression cannot be converted into constant: clear it
          onChange(null)
          setValueType(valueTypeNext)
        }
      }
    },
    [confirm, onChange, values, valuesIsEmpty]
  )

  const getExpressionIndex = useCallback(
    (expression) => A.findIndex(NodeDefExpression.isEqual(expression), values),
    [values]
  )

  const removePlaceholder = useCallback(
    (expression, callback = null) => {
      if (NodeDefExpression.getUuid(expressionPlaceholder) === NodeDefExpression.getUuid(expression)) {
        setExpressionPlaceholder(null)
      }
      callback?.()
    },
    [expressionPlaceholder]
  )

  const removeExpression = useCallback(
    ({ expression, callback = null }) => {
      const index = getExpressionIndex(expression)
      if (index >= 0) {
        const newValues = A.remove(index, 1, values)
        onChange(newValues)
        callback?.()
      } else {
        removePlaceholder(expression, callback)
      }
    },
    [getExpressionIndex, onChange, removePlaceholder, values]
  )

  const onDelete = useCallback(
    (expression, callback = null, { confirm: requireConfirmation = true } = {}) => {
      if (!requireConfirmation) {
        removeExpression({ expression, callback })
        return
      }
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'nodeDefEdit:expressionsProp.confirmDelete',
          onOk: () => {
            removeExpression({ expression, callback })
          },
        })
      )
    },
    [dispatch, removeExpression]
  )

  const onUpdate = useCallback(
    (expression, callback = null) => {
      if (NodeDefExpression.isEmpty(expression)) {
        onDelete(expression, callback)
      } else {
        removePlaceholder(expression)
        const index = getExpressionIndex(expression)
        const newValues = index >= 0 ? A.update(index, expression, values) : A.append(expression, values)
        onChange(newValues)
        callback?.()
      }
    },
    [getExpressionIndex, onChange, onDelete, removePlaceholder, values]
  )

  const uiValues = useMemo(
    () => (Objects.isEmpty(expressionPlaceholder) ? values : A.append(expressionPlaceholder, values)),
    [expressionPlaceholder, values]
  )
  const uiValuesIsEmpty = A.isEmpty(uiValues) || uiValues.every(NodeDefExpression.isEmpty)

  const onAddPlaceholder = useCallback(() => {
    if (Objects.isEmpty(expressionPlaceholder)) {
      setExpressionPlaceholder(NodeDefExpression.createExpressionPlaceholder())
    }
  }, [expressionPlaceholder])

  const onAiCancel = useCallback(() => setAiOpen(false), [])
  const onAiApply = useCallback(
    (expression) => {
      setAiOpen(false)
      onUpdate(NodeDefExpression.createExpression({ expression }))
    },
    [onUpdate]
  )

  return (
    <FormItem info={info} label={label} className={classNames({ error: Validation.isNotValid(validation) })}>
      <ExpressionsWrapper validation={validation}>
        {valueTypeSelection && (
          <ButtonGroup
            disabled={readOnly}
            items={valueTypeItems}
            onChange={onValueTypeChange}
            selectedItemKey={valueType}
          />
        )}
        {valueType === ValueType.constant && (
          <Input
            className="node-def-edit_constant-value"
            disabled={readOnly}
            numberFormat={valueConstantEditorNumberFormat}
            onChange={onChange}
            validation={validation}
            value={values?.[0]?.expression}
          />
        )}
        {(!valueTypeSelection || valueType === ValueType.expression) && (
          <div className="node-def-edit__expressions">
            {uiValues.map((value, index) => (
              <ExpressionProp
                key={NodeDefExpression.getUuid(value)}
                applyIf={applyIf}
                canBeConstant={canBeConstant}
                excludeCurrentNodeDef={excludeCurrentNodeDef}
                expression={value}
                hideAdvanced={hideAdvanced}
                index={index}
                isBoolean={isBoolean}
                isContextParent={isContextParent}
                mode={mode}
                qualifier={qualifier}
                nodeDefUuidContext={nodeDefUuidContext}
                nodeDefUuidCurrent={nodeDefUuidCurrent}
                onDelete={onDelete}
                onUpdate={onUpdate}
                readOnly={readOnly}
                severity={severity}
                showLabels={showLabels}
                validation={Validation.getFieldValidation(index)(validation)}
              />
            ))}
            {!readOnly && (multiple || uiValuesIsEmpty) && (
              <div className="node-def-edit__expressions-actions">
                <ButtonNew onClick={onAddPlaceholder} testId={TestId.expressionEditor.newBtn(qualifier)} />
                {isAiFeatureShown(aiGenerate) && nodeDefUuidCurrent && (
                  <AiPolicyBlockedTooltip availability={aiGenerate}>
                    <ButtonAiGenerateExpression
                      disabled={!isAiFeatureUsable(aiGenerate)}
                      onClick={() => setAiOpen(true)}
                      testId={TestId.expressionEditor.aiGenerateBtn(qualifier)}
                    />
                  </AiPolicyBlockedTooltip>
                )}
              </div>
            )}
          </div>
        )}
      </ExpressionsWrapper>
      {aiOpen && (
        <AiExpressionPopup
          excludeCurrentNodeDef={excludeCurrentNodeDef}
          qualifier={qualifier}
          nodeDefUuid={nodeDefUuidCurrent}
          onCancel={onAiCancel}
          onApply={onAiApply}
        />
      )}
    </FormItem>
  )
}

export default ExpressionsProp
