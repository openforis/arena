import './expressionEditor.scss'

import React from 'react'
import * as R from 'ramda'
import jsep from '../../../../common/exprParser/jsep'
import ExprUtils from '../../../../common/exprParser/exprUtils'
import { expressionTypes } from '../../../../common/exprParser/exprParser'
import { TypeSwitch } from './types'

const defaultExpression = {
  type: expressionTypes.BinaryExpression, operator: '',
  left: {type: expressionTypes.Identifier, name: ''},
  right: {type: expressionTypes.Literal, value: null, raw: ''}
}

class ExpressionEditor extends React.Component {

  constructor (props) {
    super(props)

    const {query} = props
    const expr = R.isEmpty(query) ? defaultExpression : jsep(query)

    this.state = {
      query, queryDraft: ExprUtils.toString(expr),
      expr, exprDraft: expr,
    }
  }

  updateDraft (exprDraft) {
    this.setState({
      queryDraft: ExprUtils.toString(exprDraft),
      exprDraft,
    })
  }

  getDraftToString () {
    return ExprUtils.toString(this.state.exprDraft)
  }

  render () {
    const {queryDraft, exprDraft} = this.state
    const {variables, onClose, onChange} = this.props

    return <React.Fragment>
      <button className="btn btn-of expression-builder__btn-close"
              onClick={onClose}>
        <span className="icon icon-cross icon-8px"/>
      </button>

      <div className="expression-builder__query-container">
        {/*<input type="text" className="form-input query"*/}
        {/*value={query}*/}
        {/*onChange={e => this.setState({query: e.target.value})}/>*/}
        {
          <div className="query">{
            R.isEmpty(queryDraft)
              ? <span className="placeholder">- empty -</span>
              : queryDraft
          }</div>
        }
      </div>

      {/*<div>{JSON.stringify(exprDraft)}</div>*/}

      <div className="expression-editor__container">
        <TypeSwitch variables={variables} node={exprDraft}
                    onChange={this.updateDraft.bind(this)}/>
      </div>

      <div className="expression-builder__footer">
        <button className="btn btn-xs btn-of"
                onClick={() => onChange('')}>
          <span className="icon icon-undo2 icon-16px icon-left"/> Reset
        </button>

        <button className="btn btn-xs btn-of"
                onClick={() => onChange(queryDraft)}>
          <span className="icon icon-checkmark icon-16px icon-left"/> Apply
        </button>
      </div>

    </React.Fragment>
  }

}

ExpressionEditor.defaultProps = {
  query: '',
  onClose: null,
  onChange: null,
}

export default ExpressionEditor