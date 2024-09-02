import './expressionEditorPopup.scss'

import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { useI18n } from '@webapp/store/system'
import ExpressionNode from './nodes/expressionNode'

const BasicExpressionEditorPopup = (props) => {
  const {
    exprDraft = null,
    exprDraftValid = false,
    isBoolean = true, // True if expression returns a boolean condition
    nodeDefCurrent = null,
    queryDraft = null,
    updateDraftExpr,
    variables,
  } = props

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
            isBoolean={isBoolean}
            node={exprDraft}
            nodeDefCurrent={nodeDefCurrent}
            onChange={updateDraftExpr}
            variables={variables}
          />
        )}
      </div>
    </>
  )
}

BasicExpressionEditorPopup.propTypes = {
  exprDraft: PropTypes.object,
  exprDraftValid: PropTypes.bool,
  isBoolean: PropTypes.bool,
  nodeDefCurrent: PropTypes.object,
  queryDraft: PropTypes.string,
  updateDraftExpr: PropTypes.func.isRequired,
  variables: PropTypes.arrayOf(Object).isRequired,
}

export default BasicExpressionEditorPopup
