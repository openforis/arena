import './expressionEditorPopup.scss'

import React, { useState } from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import * as Expression from '@core/expressionParser/expression'

import { ButtonGroup, Dropdown } from '@webapp/components/form'
import { useI18n } from '@webapp/store/system'
import ExpressionNode from './nodes/expressionNode'

const expressionTypes = {
  predefinedFunction: 'predefinedFunction',
  logicalExpression: 'logicalExpression',
}

const BasicExpressionEditorPopup = (props) => {
  const { nodeDefCurrent, isBoolean, variables, updateDraftExpr, queryDraft, exprDraft, exprDraftValid } = props

  const i18n = useI18n()

  const [selectedExpressionType, setSelectedExpressionType] = useState('predefinedFunction')

  return (
    <>
      <div className="expression-editor__query-container">
        <div className={`query${exprDraftValid ? '' : ' invalid'}`}>
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
            {selectedExpressionType === expressionTypes.predefinedFunction && (
              <Dropdown
                items={[{ value: 'now', label: 'functions.now' }]}
                onChange={(item) => {
                  updateDraftExpr(Expression.newCall({ callee: item.value }))
                }}
              />
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
