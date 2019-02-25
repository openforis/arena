import './editor.scss'

import React from 'react'
import * as R from 'ramda'

import Expression from '../../../../common/exprParser/expression'
import ExpressionNode from './nodes/expressionNode'

import { isNotBlank } from '../../../../common/stringUtils'

class Editor extends React.Component {

  constructor (props) {
    super(props)

    const { query, mode, canBeConstant } = props

    const exprQuery = Expression.fromString(query, mode)
    const isCompound = Expression.isCompound(exprQuery)
    const isBinary = Expression.isBinary(exprQuery)
    const isLogical = Expression.isLogical(exprQuery)

    const expr = isBinary || isLogical
      ? exprQuery
      : Expression.newBinary(
        isCompound && canBeConstant
          ? Expression.newLiteral()
          : isCompound
            ? Expression.newIdentifier()
            : exprQuery,
        Expression.newLiteral()
      )

    this.state = {
      query, queryDraft: Expression.toString(expr, mode),
      expr, exprDraft: expr, exprDraftValid: true,
    }
  }

  isExprValid (expr) {
    const { canBeConstant } = this.props
    try {

      const exprString = Expression.toString(expr)
      const exprToValidate = canBeConstant && isNotBlank(exprString)
        ? Expression.fromString(exprString)
        : expr

      return Expression.isValid(exprToValidate)
    } catch (e) {
      return false
    }
  }

  updateDraft (exprDraft) {
    this.setState({
      queryDraft: Expression.toString(exprDraft, this.props.mode),
      exprDraft,
      exprDraftValid: this.isExprValid(exprDraft),
    })
  }

  render () {
    const {
      query, queryDraft,
      exprDraft, exprDraftValid
    } = this.state

    const {
      variables, isBoolean,
      onChange,
      literalSearchParams,
    } = this.props

    return <React.Fragment>

      <div className="expression__query-container">
        <div className={`query${exprDraftValid ? '' : ' invalid'}`}>
          {
            R.isEmpty(queryDraft)
              ? <span className="placeholder">- empty -</span>
              : queryDraft
          }
        </div>
      </div>

      <div className="expression-editor__expr-container">
        <ExpressionNode variables={variables} node={exprDraft}
                        onChange={this.updateDraft.bind(this)}
                        isBoolean={isBoolean}
                        literalSearchParams={literalSearchParams}/>
      </div>

      <div className="expression-editor__footer">
        <button className="btn btn-xs btn-of"
                onClick={() => onChange('')}
                aria-disabled={R.isEmpty(query)}>
          <span className="icon icon-undo2 icon-16px"/> Reset
        </button>

        <button className="btn btn-xs btn-of"
                onClick={() => onChange(queryDraft)}
                aria-disabled={query === queryDraft || !exprDraftValid}>
          <span className="icon icon-checkmark icon-16px"/> Apply
        </button>
      </div>

    </React.Fragment>
  }

}

Editor.defaultProps = {
  query: '',
  mode: Expression.modes.json,
  isBoolean: true,
  onClose: null,
  onChange: null,
  literalSearchParams: null,
}

export default Editor