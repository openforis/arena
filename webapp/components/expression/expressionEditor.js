import './expressionEditor.scss'

import React, { useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import * as Expression from '@core/expressionParser/expression'
import * as NodeDef from '@core/survey/nodeDef'
import { TestId } from '@webapp/utils/testId'
import { useI18n } from '@webapp/store/system'

import ExpressionEditorPopup from './expressionEditorPopup'
import { ExpressionEditorType } from './expressionEditorType'
import { useNodeDefByUuid } from '@webapp/store/survey'
import { Button } from '../buttons'
import AiExpressionPopup from '@webapp/components/ai/AiExpressionPopup'
import AiExplainPanel from '@webapp/components/ai/AiExplainPanel'
import { useAiFeatureEnabled } from '@webapp/components/ai/hooks/useAiFeatureEnabled'

const ExpressionEditor = (props) => {
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
  const aiExpressionsEnabled = useAiFeatureEnabled('expressions')

  const [edit, setEdit] = useState(placeholder)
  const [aiOpen, setAiOpen] = useState(false)
  const [explainOpen, setExplainOpen] = useState(false)

  const closeEditor = useCallback(() => setEdit(false), [])
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
          qualifier={qualifier}
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
          types={types}
          header={popupHeader}
        />
      ) : (
        <div className="expression-editor__query-container">
          {!R.isEmpty(query) && (
            <div className="query" id={`${idPrefix}-query`} data-testid={TestId.expressionEditor.query(qualifier)}>
              {query}
            </div>
          )}
          {!readOnly && (
            <Button
              className="btn-s btn-edit"
              iconClassName="icon-pencil2 icon-14px"
              id={`${idPrefix}-edit-btn`}
              onClick={() => setEdit(true)}
              testId={TestId.expressionEditor.editBtn(qualifier, index)}
            />
          )}
          {aiExpressionsEnabled && !readOnly && nodeDefUuidCurrent && (
            <Button
              className="btn-s btn-ai"
              iconClassName="icon-magic-wand icon-14px"
              id={`${idPrefix}-ai-btn`}
              onClick={() => setAiOpen(true)}
              title="aiExpression.title"
            />
          )}
          {aiExpressionsEnabled && !R.isEmpty(query) && nodeDefUuidCurrent && (
            <Button
              className="btn-s btn-ai-explain"
              iconClassName="icon-question icon-14px"
              id={`${idPrefix}-ai-explain-btn`}
              onClick={() => setExplainOpen(true)}
              title="aiExpression.explain.title"
            />
          )}
        </div>
      )}
      {aiOpen && (
        <AiExpressionPopup
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

ExpressionEditor.propTypes = {
  index: PropTypes.number, // used when rendering multiple expression editor elements
  qualifier: PropTypes.string.isRequired, // used to generate test ids
  placeholder: PropTypes.bool, // true if the element is a placeholder
  query: PropTypes.string, // String representing the expression
  nodeDefUuidContext: PropTypes.string, // Entity
  nodeDefUuidCurrent: PropTypes.string, // Attribute
  excludeCurrentNodeDef: PropTypes.bool,
  mode: PropTypes.oneOf([Expression.modes.json, Expression.modes.sql]),
  types: PropTypes.arrayOf(PropTypes.oneOf([ExpressionEditorType.basic, ExpressionEditorType.advanced])), // allowed expression types
  isContextParent: PropTypes.bool,
  canBeCall: PropTypes.bool,
  canBeConstant: PropTypes.bool,
  isBoolean: PropTypes.bool,
  onChange: PropTypes.func,
  onCancel: PropTypes.func,
  onEditChange: PropTypes.func,
  readOnly: PropTypes.bool,
}

export default ExpressionEditor
