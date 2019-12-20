import './expressionEditorPopup.scss'

import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import * as Expression from '@core/expressionParser/expression'
import { useI18n } from '../hooks'
import ExpressionNode from './nodes/expressionNode'

import { mapStateToProps } from './expressionEditorPopupState'

const BasicExpressionEditorPopup = props => {
  const { nodeDefCurrent, isBoolean, variables, updateDraft, queryDraft, exprDraft, exprDraftValid } = props

  const i18n = useI18n()

  return (
    <>
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
    </>
  )
}

BasicExpressionEditorPopup.defaultProps = {
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

export default connect(mapStateToProps)(BasicExpressionEditorPopup)
