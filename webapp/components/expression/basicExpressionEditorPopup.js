import './expressionEditorPopup.scss'

import React, { useState } from 'react'
import * as R from 'ramda'
import classNames from 'classnames'
import PropTypes from 'prop-types'

import { ButtonGroup } from '@webapp/components/form'
import { useI18n } from '@webapp/store/system'
import ExpressionNode from './nodes/expressionNode'
import Call from './nodes/call'

const expressionTypes = {
  logicalExpression: 'logicalExpression',
  functionCall: 'functionCall',
}

const BasicExpressionEditorPopup = (props) => {
  const { nodeDefCurrent, isBoolean, variables, updateDraftExpr, queryDraft, exprDraft, exprDraftValid } = props

  const i18n = useI18n()

  const [selectedExpressionType, setSelectedExpressionType] = useState(expressionTypes.logicalExpression)

  return (
    <>
      <div className="expression-editor__query-container">
        <div className={classNames('query', { invalid: !exprDraftValid })}>
          {R.isEmpty(queryDraft) ? <span className="placeholder">- {i18n.t('common.empty')} -</span> : queryDraft}
        </div>
      </div>

      <div className="expression-editor-popup__expr-container">
        {!exprDraft && (
          <>
            <ButtonGroup
              items={Object.keys(expressionTypes).map((key) => ({ key, label: key }))}
              onChange={setSelectedExpressionType}
              selectedItemKey={selectedExpressionType}
            />
            {selectedExpressionType === expressionTypes.functionCall && (
              <Call node={exprDraft} variables={variables} onChange={updateDraftExpr} />
            )}
          </>
        )}
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

BasicExpressionEditorPopup.defaultProps = {
  exprDraft: null,
  exprDraftValid: false,
  isBoolean: true, // True if expression returns a boolean condition
  nodeDefCurrent: null,
  queryDraft: null,
}

export default BasicExpressionEditorPopup
