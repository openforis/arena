import './editor.scss'

import React from 'react'
import * as R from 'ramda'

import Expression from '../../../../common/exprParser/expression'
import { ExpressionNode } from './types'

const defaultExpression = Expression.newBinary()

class Editor extends React.Component {

  constructor (props) {
    super(props)

    const {query, mode} = props
    const expr = R.isEmpty(query) ? defaultExpression : Expression.fromString(query, mode)

    this.state = {
      query, queryDraft: Expression.toString(expr, mode),
      expr, exprDraft: expr, exprDraftValid: true,
    }
  }

  updateDraft (exprDraft) {
    this.setState({
      queryDraft: Expression.toString(exprDraft, this.props.mode),
      exprDraft,
      exprDraftValid: Expression.isValid(exprDraft),
    })
  }

  render () {
    const {query, queryDraft, exprDraft, exprDraftValid} = this.state
    const {variables, onClose, onChange} = this.props

    return <React.Fragment>

      <button className="btn btn-of expression-editor__btn-close"
              onClick={onClose}>
        <span className="icon icon-cross icon-8px"/>
      </button>

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
                        onChange={this.updateDraft.bind(this)}/>
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
  onClose: null,
  onChange: null,
}

export default Editor