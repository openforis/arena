import './expressionEditorPopup.scss'

import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import * as Expression from '@core/expressionParser/expression'
import Popup from '../popup'
import { useI18n } from '../hooks'
import ExpressionNode from './nodes/expressionNode'

import { useExpressionEditorPopupState, mapStateToProps } from './expressionEditorPopupState'

import AdvancedExpressionEditorPopup from './advancedExpressionEditor'

const ExpressionEditorPopup = props => {
  // IsGeneralExpression: this not just a boolean expression, i.e. the advanced mode can be used
  const { nodeDefCurrent, isBoolean, variables, onChange, onClose, hideAdvanced } = props

  const {
    query,
    queryDraft,
    exprDraft,
    exprDraftValid,
    updateDraft,
    resetDraft,
    advanced,
    setAdvancedEditor,
  } = useExpressionEditorPopupState(props)

  const i18n = useI18n()

  if (advanced)
    return (
      <AdvancedExpressionEditorPopup
        setAdvancedEditor={setAdvancedEditor}
        revertToBasicMode={() => {
          resetDraft()
          setAdvancedEditor(false)
        }}
        {...props}
      />
    )

  return (
    <Popup className="expression-editor-popup" onClose={onClose} padding={20}>
      <button hidden={hideAdvanced} onClick={() => setAdvancedEditor(true)} style={{ position: 'absolute', right: 0 }}>
        {i18n.t('nodeDefEdit.expressionsProp.advanced')}
      </button>

      <div className="expression-editor__query-container">
        <div className={`query${exprDraftValid ? '' : ' invalid'}`}>
          {R.isEmpty(queryDraft) ? <span className="placeholder">- {i18n.t('common.empty')} -</span> : queryDraft}
        </div>
      </div>

      <div className="expression-editor-popup__expr-container">
        {exprDraft && (
          <ExpressionNode
            variables={variables}
            node={exprDraft}
            onChange={updateDraft}
            isBoolean={isBoolean}
            nodeDefCurrent={nodeDefCurrent}
          />
        )}
      </div>

      <div className="expression-editor-popup__footer">
        <button className="btn btn-xs" onClick={() => onChange('')} aria-disabled={R.isEmpty(query)}>
          <span className="icon icon-undo2 icon-12px" />
          {i18n.t('common.reset')}
        </button>

        <button
          className="btn btn-xs"
          onClick={() => onChange(queryDraft, exprDraft)}
          aria-disabled={query === queryDraft || !exprDraftValid}
        >
          <span className="icon icon-checkmark icon-12px" />
          {i18n.t('common.apply')}
        </button>
      </div>
    </Popup>
  )
}

ExpressionEditorPopup.defaultProps = {
  query: '', // String representing the expression
  expr: null, // AST expression
  // NOTE: One of the two above is passed on component creation
  nodeDefUuidContext: '', // Entity
  nodeDefUuidCurrent: null, // Attribute
  mode: Expression.modes.json,
  isContextParent: false,
  canBeConstant: false, // True if expression can be a constant value like a number or a string
  isBoolean: true, // True if expression returns a boolean condition
  hideAdvanced: false,

  literalSearchParams: null,
  onClose: _ => {},
  onChange: _ => {},
}

export default connect(mapStateToProps)(ExpressionEditorPopup)
