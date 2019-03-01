import './expressionEditor.scss'

import React from 'react'
import * as R from 'ramda'

import ExpressionEditorPopup from './expressionEditorPopup'

import Expression from '../../../common/exprParser/expression'

class ExpressionEditor extends React.PureComponent {

  constructor (props) {
    super(props)

    this.state = { edit: false }
    this.toggleEdit = this.toggleEdit.bind(this)
  }

  applyChange (query) {
    const { onChange } = this.props
    onChange && onChange(query)

    this.toggleEdit()
  }

  toggleEdit () {
    this.setState(state => ({ edit: !state.edit }))
  }

  render () {

    const {
      query, nodeDefUuidContext, nodeDefUuidCurrent, mode,
      isContextParent, canBeConstant, isBoolean,
    } = this.props

    const { edit } = this.state

    return (
      <div className="expression-editor">

        {
          edit
            ? (
              <ExpressionEditorPopup
                query={query}
                nodeDefUuidContext={nodeDefUuidContext}
                nodeDefUuidCurrent={nodeDefUuidCurrent}
                mode={mode}
                isContextParent={isContextParent}
                canBeConstant={canBeConstant}
                isBoolean={isBoolean}
                onClose={this.toggleEdit}
                onChange={query => this.applyChange(query)}
              />
            )
            : (
              <div className="expression-editor__query-container">
                {
                  !R.isEmpty(query) &&
                  <div className="query">{query}</div>
                }
                <button className="btn btn-s btn-of-light btn-edit"
                        onClick={this.toggleEdit}>
                  <span className="icon icon-pencil2 icon-14px"/>
                </button>
              </div>
            )
        }

      </div>
    )
  }
}

ExpressionEditor.defaultProps = {
  query: '',
  nodeDefUuidContext: '',
  nodeDefUuidCurrent: null,
  mode: Expression.modes.json,
  isContextParent: false,
  canBeConstant: false,
  isBoolean: true,

  onChange: _ => {},
}

export default ExpressionEditor