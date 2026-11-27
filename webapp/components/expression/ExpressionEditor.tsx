import './ExpressionEditor.scss'

import { useCallback, useEffect, useState } from 'react'

import * as A from '@core/arena'
import * as Expression from '@core/expressionParser/expression'
import * as NodeDef from '@core/survey/nodeDef'
import { isAiFeatureShown, isAiFeatureUsable } from '@webapp/ai/policy/aiFeatureAvailability'
import AiExplainPanel from '@webapp/components/ai/AiExplainPanel'
import AiExpressionPopup from '@webapp/components/ai/AiExpressionPopup'
import { AiPolicyBlockedTooltip } from '@webapp/components/ai/AiPolicyBlockedTooltip'
import ButtonAiGenerateExpression from '@webapp/components/ai/ButtonAiGenerateExpression'
import { useAiFeatureAvailability } from '@webapp/components/ai/hooks/useAiFeatureAvailability'
import { useNodeDefByUuid } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'
import { Button } from '../buttons'

import ExpressionEditorPopup from './ExpressionEditorPopup'
import { ExpressionEditorType } from './expressionEditorType'

type ExpressionEditorProps = {
  index?: number // used when rendering multiple expression editor elements
  qualifier: string // used to generate test ids
  placeholder?: boolean // true if the element is a placeholder
  query?: string // String representing the expression
  nodeDefUuidContext?: string // Entity
  nodeDefUuidCurrent?: string // Attribute
  excludeCurrentNodeDef?: boolean
  mode?: any
  types?: any[] // allowed expression types
  isContextParent?: boolean
  canBeCall?: boolean
  canBeConstant?: boolean
  isBoolean?: boolean
  onChange?: (...args: any[]) => any
  onCancel?: (...args: any[]) => any
  onEditChange?: (...args: any[]) => any
  readOnly?: boolean
}

const ExpressionEditor = (props: ExpressionEditorProps) => {
  const {
    canBeCall = false,
    canBeConstant = false,
    excludeCurrentNodeDef = true,
    index = 0,
    isBoolean = true,
    isContextParent = false,
    mode = Expression.modes.json,
    nodeDefUuidContext = '',
    nodeDefUuidCurrent = null,
    onChange = () => {},
    onCancel = null,
    onEditChange = null,
    placeholder = false,
    qualifier,
    query = '',
    readOnly = false,
    types = [ExpressionEditorType.basic, ExpressionEditorType.advanced],
  } = props

  const i18n = useI18n()
  const nodeDefCurrent = useNodeDefByUuid(nodeDefUuidCurrent)
  const aiGenerate = useAiFeatureAvailability('expressionGenerate')
  const aiExplain = useAiFeatureAvailability('expressionExplain')
  const aiGenerateShown = isAiFeatureShown(aiGenerate) && !readOnly && Boolean(nodeDefUuidCurrent)

  const [edit, setEdit] = useState(placeholder)
  const [aiOpen, setAiOpen] = useState(false)
  const [explainOpen, setExplainOpen] = useState(false)

  const closeEditor = useCallback(() => setEdit(false), [])
  const onOpenAiFromEditor = useCallback(() => {
    closeEditor()
    setAiOpen(true)
  }, [closeEditor])
  const onAiCancel = useCallback(() => setAiOpen(false), [])
  const onAiApply = useCallback(
    (expression) => {
      setAiOpen(false)
      onChange?.({ query: expression })
    },
    [onChange]
  )
  const onExplainClose = useCallback(() => setExplainOpen(false), [])

  useEffect(() => {
    onEditChange?.(edit)
  }, [edit, onEditChange])

  // Unified handler for both cancel and close actions.
  const handleClose = useCallback(() => {
    if (placeholder && onCancel) {
      onCancel()
    }
    closeEditor()
  }, [closeEditor, onCancel, placeholder])

  const applyChange = useCallback(
    ({ query }) => {
      if (onChange) {
        onChange({ query, callback: closeEditor })
      } else {
        closeEditor()
      }
    },
    [closeEditor, onChange]
  )

  const idPrefix = `expression-editor-${placeholder ? 'placeholder' : index}-${qualifier}`

  const qualifierLabel = i18n.t(`expressionEditor.qualifier.${qualifier}`)
  const popupHeader = nodeDefCurrent
    ? i18n.t('expressionEditor.header.editingExpressionForNodeDefinition', {
        qualifier: qualifierLabel,
        nodeDef: NodeDef.getName(nodeDefCurrent),
      })
    : null

  return (
    <div className="expression-editor">
      {edit ? (
        <ExpressionEditorPopup
          query={query}
          nodeDefUuidContext={nodeDefUuidContext}
          nodeDefUuidCurrent={nodeDefUuidCurrent}
          excludeCurrentNodeDef={excludeCurrentNodeDef}
          mode={mode}
          isContextParent={isContextParent}
          canBeCall={canBeCall}
          canBeConstant={canBeConstant}
          isBoolean={isBoolean}
          onClose={handleClose}
          onChange={applyChange}
          onGenerateWithAi={aiGenerateShown && isAiFeatureUsable(aiGenerate) ? onOpenAiFromEditor : null}
          types={types}
          header={popupHeader}
        />
      ) : (
        <div className="expression-editor__query-container">
          {!A.isEmpty(query) && (
            <div className="query" id={`${idPrefix}-query`} data-testid={TestId.expressionEditor.query(qualifier)}>
              {query}
            </div>
          )}
          {!readOnly && (
            <Button
              className="btn-s btn-edit"
              iconName="edit"
              iconSize={16}
              id={`${idPrefix}-edit-btn`}
              onClick={() => setEdit(true)}
              testId={TestId.expressionEditor.editBtn(qualifier, index)}
            />
          )}
          {aiGenerateShown && (
            <AiPolicyBlockedTooltip availability={aiGenerate}>
              <ButtonAiGenerateExpression
                id={`${idPrefix}-ai-btn`}
                disabled={!isAiFeatureUsable(aiGenerate)}
                onClick={() => setAiOpen(true)}
              />
            </AiPolicyBlockedTooltip>
          )}
          {isAiFeatureShown(aiExplain) && !A.isEmpty(query) && nodeDefUuidCurrent && (
            <AiPolicyBlockedTooltip availability={aiExplain}>
              <Button
                className="btn-s btn-ai-explain"
                disabled={!isAiFeatureUsable(aiExplain)}
                iconName="help"
                iconSize={16}
                id={`${idPrefix}-ai-explain-btn`}
                onClick={() => setExplainOpen(true)}
                testId={TestId.expressionEditor.explainBtn(qualifier, index)}
                title="aiExpression.explain.title"
              />
            </AiPolicyBlockedTooltip>
          )}
        </div>
      )}
      {aiOpen && (
        <AiExpressionPopup
          excludeCurrentNodeDef={excludeCurrentNodeDef}
          qualifier={qualifier}
          nodeDefUuid={nodeDefUuidCurrent}
          onCancel={onAiCancel}
          onApply={onAiApply}
        />
      )}
      {explainOpen && <AiExplainPanel expression={query} nodeDefUuid={nodeDefUuidCurrent} onClose={onExplainClose} />}
    </div>
  )
}

export default ExpressionEditor
