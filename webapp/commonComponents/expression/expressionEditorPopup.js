import './expressionEditorPopup.scss'

import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import Popup from '../popup'
import ExpressionNode from './nodes/expressionNode'
import { useI18n } from '../hooks'

import Expression from '@core/expressionParser/expression'

import { useExpressionEditorPopupState, mapStateToProps } from './expressionEditorPopupState'

const ExpressionEditorPopup = props => {
  const {
    nodeDefCurrent, isBoolean, variables,
    onChange, onClose,
  } = props

  const {
    query, queryDraft,
    exprDraft, exprDraftValid,
    updateDraft,
  } = useExpressionEditorPopupState(props)

  const i18n = useI18n()

  return (
    <Popup
      className="expression-editor-popup"
      onClose={onClose}
      padding={20}>

      <div className="expression-editor__query-container">
        <div className={`query${exprDraftValid ? '' : ' invalid'}`}>
          {
            R.isEmpty(queryDraft)
              ? <span className="placeholder">- {i18n.t('common.empty')} -</span>
              : queryDraft
          }
        </div>
      </div>

      <div className="expression-editor-popup__expr-container">
        {
          exprDraft &&
          <ExpressionNode
            variables={variables}
            node={exprDraft}
            onChange={updateDraft}
            isBoolean={isBoolean}
            nodeDefCurrent={nodeDefCurrent}
          />
        }
      </div>

      <div className="expression-editor-popup__footer">
        <button className="btn btn-xs"
                onClick={() => onChange('')}
                aria-disabled={R.isEmpty(query)}>
          <span className="icon icon-undo2 icon-12px"/>
          {i18n.t('common.reset')}
        </button>

        <button className="btn btn-xs"
                onClick={() => onChange(queryDraft, exprDraft)}
                aria-disabled={query === queryDraft || !exprDraftValid}>
          <span className="icon icon-checkmark icon-12px"/>
          {i18n.t('common.apply')}
        </button>
      </div>

    </Popup>
  )

}

ExpressionEditorPopup.defaultProps = {
  query: '', // string representing the expression
  expr: null, // AST expression
  //NOTE: One of the two above is passed on component creation
  nodeDefUuidContext: '', // entity
  nodeDefUuidCurrent: null, // attribute
  mode: Expression.modes.json,
  isContextParent: false,
  canBeConstant: false, // true if expression can be a constant value like a number or a string
  isBoolean: true, // true if expression returns a boolean condition

  literalSearchParams: null,
  onClose: _ => {},
  onChange: _ => {},
}

export default connect(mapStateToProps)(ExpressionEditorPopup)