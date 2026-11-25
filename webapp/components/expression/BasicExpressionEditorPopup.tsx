import './ExpressionEditorPopup.scss'

import * as A from '@core/arena'
import classNames from 'classnames'

import { useI18n } from '@webapp/store/system'
import ExpressionNode from './nodes/expressionNode'

type BasicExpressionEditorPopupProps = {
  exprDraft?: Record<string, any>
  exprDraftValid?: boolean
  isBoolean?: boolean
  nodeDefCurrent?: Record<string, any>
  queryDraft?: string
  updateDraftExpr: (...args: any[]) => any
  variables: Record<string, any>[]
}

const BasicExpressionEditorPopup = (props: BasicExpressionEditorPopupProps) => {
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
        <div className={classNames('query', { invalid: !exprDraftValid })}>
          {A.isEmpty(queryDraft) ? <span className="placeholder">- {i18n.t('common.empty')} -</span> : queryDraft}
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

export default BasicExpressionEditorPopup
