import './expressionEditorPopup.scss'

import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import * as Expression from '@core/expressionParser/expression'

import { useI18n } from '@webapp/store/system'

import PanelRight from '@webapp/components/PanelRight'

import { useExpressionEditorPopupState } from './expressionEditorPopupState'

import AdvancedExpressionEditorPopup from './advancedExpressionEditorPopup'
import BasicExpressionEditorPopup from './basicExpressionEditorPopup'
import { ExpressionEditorType } from './expressionEditorType'

const ExpressionEditorPopup = (props) => {
  const {
    canBeConstant,
    expr,
    types,
    isBoolean,
    mode,
    nodeDefUuidContext,
    nodeDefUuidCurrent,
    excludeCurrentNodeDef,
    onChange,
    onClose,
    query,
    header,
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
    setExpressionCanBeApplied,
    updateDraftExpr,
    updateDraftQuery,
    variables,
  } = useExpressionEditorPopupState({
    canBeConstant,
    expr,
    mode,
    type: types,
    nodeDefUuidContext,
    nodeDefUuidCurrent,
    onChange,
    query,
  })

  const i18n = useI18n()

  return (
    <PanelRight onClose={onClose} width="100vw" header={header}>
      <div className="expression-editor-popup">
        {types.includes(ExpressionEditorType.basic) && types.includes(ExpressionEditorType.advanced) && (
          <button
            type="button"
            className="expression-editor-popup__toggle-advanced btn-s"
            onClick={onToggleAdvancedEditor}
          >
            {advanced ? i18n.t('nodeDefEdit.basic') : i18n.t('nodeDefEdit.advanced')}
          </button>
        )}
        {advanced ? (
          <AdvancedExpressionEditorPopup
            nodeDefCurrent={nodeDefCurrent}
            excludeCurrentNodeDef={excludeCurrentNodeDef}
            query={query}
            setExpressionCanBeApplied={setExpressionCanBeApplied}
            updateDraftQuery={updateDraftQuery}
            variables={variables}
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
          <button type="button" className="btn btn-s" onClick={() => onChange('')} aria-disabled={R.isEmpty(query)}>
            <span className="icon icon-undo2 icon-12px" />
            {i18n.t('common.reset')}
          </button>

          <button
            type="button"
            className="btn btn-s btn-primary"
            onClick={onApply}
            aria-disabled={!expressionCanBeApplied}
          >
            <span className="icon icon-checkmark icon-12px" />
            {i18n.t('common.apply')}
          </button>
        </div>
      </div>
    </PanelRight>
  )
}

ExpressionEditorPopup.propTypes = {
  canBeConstant: PropTypes.bool, // True if expression can be a constant value like a number or a string
  excludeCurrentNodeDef: PropTypes.bool,
  expr: PropTypes.object, // AST expression
  header: PropTypes.node,
  isBoolean: PropTypes.bool, // True if expression returns a boolean condition
  mode: PropTypes.oneOf([Expression.modes.json, Expression.modes.sql]),
  // NOTE: One of the two above is passed on component creation
  nodeDefUuidContext: PropTypes.string, // Entity
  nodeDefUuidCurrent: PropTypes.string, // Attribute
  onChange: PropTypes.func,
  onClose: PropTypes.func,
  query: PropTypes.string, // String representing the expression
  types: PropTypes.arrayOf(PropTypes.oneOf([ExpressionEditorType.basic, ExpressionEditorType.advanced])), // allowed expression types
}

ExpressionEditorPopup.defaultProps = {
  canBeConstant: false,
  excludeCurrentNodeDef: true,
  expr: null,
  header: '',
  isBoolean: true,
  mode: Expression.modes.json,
  nodeDefUuidContext: null,
  nodeDefUuidCurrent: null,
  onChange: () => {},
  onClose: () => {},
  query: '',
  types: [ExpressionEditorType.basic, ExpressionEditorType.advanced],
}

export default ExpressionEditorPopup
