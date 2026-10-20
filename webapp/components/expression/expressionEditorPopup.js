import './expressionEditorPopup.scss'

import PropTypes from 'prop-types'
import * as A from '@core/arena'

import * as Expression from '@core/expressionParser/expression'

import { TestId } from '@webapp/utils/testId'

import PanelRight from '@webapp/components/PanelRight'

import { Button } from '../buttons'
import ButtonAiGenerateExpression from '@webapp/components/ai/ButtonAiGenerateExpression'
import { useExpressionEditorPopupState } from './expressionEditorPopupState'
import AdvancedExpressionEditorPopup from './advancedExpressionEditorPopup'
import BasicExpressionEditorPopup from './basicExpressionEditorPopup'
import { ExpressionEditorType } from './expressionEditorType'

const ExpressionEditorPopup = (props) => {
  const {
    canBeCall = false,
    canBeConstant = false,
    excludeCurrentNodeDef = true,
    expr = null,
    header = '',
    includeAnalysis = false,
    isBoolean = true,
    isContextParent = false,
    mode = Expression.modes.json,
    nodeDefUuidContext = null,
    nodeDefUuidCurrent = null,
    onChange = () => {},
    onClose = () => {},
    onGenerateWithAi = null,
    query = '',
    types = [ExpressionEditorType.basic, ExpressionEditorType.advanced],
  } = props

  const {
    advanced,
    expressionCanBeApplied,
    exprDraft,
    exprDraftValid,
    nodeDefCurrent,
    onApply,
    onToggleAdvancedEditor,
    queryDraft,
    updateDraftExpr,
    updateDraftQuery,
    variables,
  } = useExpressionEditorPopupState({
    canBeCall,
    canBeConstant,
    excludeCurrentNodeDef,
    expr,
    mode,
    type: types,
    nodeDefUuidContext,
    nodeDefUuidCurrent,
    onChange,
    query,
    includeAnalysis,
  })

  return (
    <PanelRight onClose={onClose} width="100vw" header={header}>
      <div className="expression-editor-popup">
        <div className="expression-editor-popup__toolbar">
          {types.includes(ExpressionEditorType.basic) && types.includes(ExpressionEditorType.advanced) && (
            <Button
              className="expression-editor-popup__toggle-advanced"
              label={advanced ? 'nodeDefEdit.basic' : 'nodeDefEdit.advanced'}
              onClick={onToggleAdvancedEditor}
              size="small"
              testId={TestId.expressionEditor.toggleModeBtn}
            />
          )}
          {onGenerateWithAi && (
            <ButtonAiGenerateExpression
              onClick={onGenerateWithAi}
              testId={TestId.expressionEditor.aiPopupBtn}
              variant="outlined"
            />
          )}
        </div>
        {advanced ? (
          <AdvancedExpressionEditorPopup
            nodeDefCurrent={nodeDefCurrent}
            excludeCurrentNodeDef={excludeCurrentNodeDef}
            includeAnalysis={includeAnalysis}
            isContextParent={isContextParent}
            query={queryDraft}
            updateDraftQuery={updateDraftQuery}
            mode={mode}
          />
        ) : (
          <BasicExpressionEditorPopup
            exprDraft={exprDraft}
            exprDraftValid={exprDraftValid}
            isBoolean={isBoolean}
            nodeDefCurrent={nodeDefCurrent}
            excludeCurrentNodeDef={excludeCurrentNodeDef}
            query={query}
            queryDraft={queryDraft}
            updateDraftExpr={updateDraftExpr}
            variables={variables}
          />
        )}

        <div className="expression-editor-popup__footer">
          <Button
            disabled={A.isEmpty(query)}
            iconClassName="icon-undo2 icon-12px"
            label="common.reset"
            onClick={() => onChange('')}
            size="small"
            variant="outlined"
          />

          <Button
            className="btn-primary"
            disabled={!expressionCanBeApplied}
            iconClassName="icon-checkmark icon-12px"
            label="common.apply"
            onClick={onApply}
            size="small"
            testId={TestId.expressionEditor.applyBtn}
          />

          <Button label="common.cancel" onClick={onClose} size="small" variant="outlined" />
        </div>
      </div>
    </PanelRight>
  )
}

ExpressionEditorPopup.propTypes = {
  canBeCall: PropTypes.bool, // True if expression can be a function call
  canBeConstant: PropTypes.bool, // True if expression can be a constant value like a number or a string
  excludeCurrentNodeDef: PropTypes.bool,
  expr: PropTypes.object, // AST expression
  header: PropTypes.node,
  includeAnalysis: PropTypes.bool,
  isBoolean: PropTypes.bool, // True if expression returns a boolean condition
  isContextParent: PropTypes.bool, // True if the context node def is the parent of the current node def
  mode: PropTypes.oneOf([Expression.modes.json, Expression.modes.sql]),
  // NOTE: One of the two above is passed on component creation
  nodeDefUuidContext: PropTypes.string, // Entity
  nodeDefUuidCurrent: PropTypes.string, // Attribute
  onChange: PropTypes.func,
  onClose: PropTypes.func,
  onGenerateWithAi: PropTypes.func, // if set, shows a button to generate the expression from a description via AI
  query: PropTypes.string, // String representing the expression
  types: PropTypes.arrayOf(PropTypes.oneOf([ExpressionEditorType.basic, ExpressionEditorType.advanced])), // allowed expression types
}

export default ExpressionEditorPopup
