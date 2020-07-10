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

const ExpressionEditorPopup = (props) => {
  const {
    canBeConstant,
    expr,
    hideAdvanced,
    isBoolean,
    mode,
    nodeDefUuidContext,
    nodeDefUuidCurrent,
    onChange,
    onClose,
    query,
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
    nodeDefUuidContext,
    nodeDefUuidCurrent,
    onChange,
    query,
  })

  const i18n = useI18n()

  return (
    <PanelRight onClose={onClose} width="1020px">
      <div className="expression-editor-popup">
        <button
          type="button"
          className="expression-editor-popup__toggle-advanced btn-s"
          hidden={hideAdvanced}
          onClick={onToggleAdvancedEditor}
        >
          {advanced ? i18n.t('nodeDefEdit.basic') : i18n.t('nodeDefEdit.advanced')}
        </button>

        {advanced ? (
          <AdvancedExpressionEditorPopup
            nodeDefCurrent={nodeDefCurrent}
            query={query}
            setExpressionCanBeApplied={setExpressionCanBeApplied}
            updateDraftQuery={updateDraftQuery}
            variables={variables}
          />
        ) : (
          <BasicExpressionEditorPopup
            exprDraft={exprDraft}
            exprDraftValid={exprDraftValid}
            isBoolean={isBoolean}
            nodeDefCurrent={nodeDefCurrent}
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
  expr: PropTypes.object, // AST expression
  hideAdvanced: PropTypes.bool, // True if expression returns a boolean condition
  isBoolean: PropTypes.bool,
  mode: PropTypes.string,
  // NOTE: One of the two above is passed on component creation
  nodeDefUuidContext: PropTypes.string, // Entity
  nodeDefUuidCurrent: PropTypes.string, // Attribute
  onChange: PropTypes.func,
  onClose: PropTypes.func,
  query: PropTypes.string, // String representing the expression
}

ExpressionEditorPopup.defaultProps = {
  canBeConstant: false,
  expr: null,
  hideAdvanced: false,
  isBoolean: true,
  mode: Expression.modes.json,
  nodeDefUuidContext: null,
  nodeDefUuidCurrent: null,
  onChange: () => {},
  onClose: () => {},
  query: '',
}

export default ExpressionEditorPopup
