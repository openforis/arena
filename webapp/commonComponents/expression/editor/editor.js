import './editor.scss'

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

class Editor extends React.Component {

  constructor (props) {
    super(props)

    const {query} = props
    const expr = R.isEmpty(query) ? defaultExpression : jsep(query)

    this.state = {
      query, queryDraft: ExprUtils.toString(expr),
      expr, exprDraft: expr, exprDraftValid: true,
    }
  }

  updateDraft (exprDraft) {
    this.setState({
      queryDraft: ExprUtils.toString(exprDraft),
      exprDraft,
      exprDraftValid: ExprUtils.isValid(exprDraft),
    })
  }

  getDraftToString () {
    return ExprUtils.toString(this.state.exprDraft)
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

      {/*<div>{JSON.stringify(exprDraft)}</div>*/}

      <div className="expression-editor__expr-container">
        <TypeSwitch variables={variables} node={exprDraft}
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
  onClose: null,
  onChange: null,
}

export default Editor