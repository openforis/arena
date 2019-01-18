import './expression.scss'

import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'
import memoize from 'memoize-one'

import Editor from './editor/editor'

import * as SurveyState from '../../survey/surveyState'
import Survey from '../../../common/survey/survey'

import Expression from '../../../common/exprParser/expression'
import * as ExpressionVariables from './expressionVariables'

import { elementOffset } from '../../appUtils/domUtils'

class ExpressionComponent extends React.Component {

  constructor (props) {
    super(props)

    this.state = {edit: false}

    this.elementRef = React.createRef()

    this.toggleEdit = this.toggleEdit.bind(this)
    this.getStyle = memoize(this.getStyle.bind(this))
  }

  getStyle (edit) {
    const elemOffset = edit ? elementOffset(this.elementRef.current) : null
    const padding = 20
    return elemOffset
      ? {padding, top: (elemOffset.top - padding) + 'px', left: (elemOffset.left - padding) + 'px'}
      : {}
  }

  applyChange (query) {
    const {onChange} = this.props
    onChange && onChange(query)

    this.toggleEdit()
  }

  toggleEdit () {
    this.setState(state => ({edit: !state.edit}))
  }

  render () {
    const {query, variables, mode} = this.props
    const {edit} = this.state

    return <div className={`expression${edit ? ' edit' : ''}`}
                ref={this.elementRef}
                style={this.getStyle(edit)}>
      {
        edit
          ? (
            <Editor query={query}
                    variables={variables}
                    onClose={this.toggleEdit}
                    onChange={query => this.applyChange(query)}
                    mode={mode}/>
          )
          : (
            <div className="expression__query-container">
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
  }
}

ExpressionComponent.defaultProps = {
  nodeDefUuid: '',
  query: '',
  mode: Expression.modes.json,
  onChange: null,
}

const mapStateToProps = (state, props) => {
  const survey = SurveyState.getSurvey(state)
  const {
    nodeDefUuid,
    mode = ExpressionComponent.defaultProps.mode
  } = props

  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
  const variables = ExpressionVariables.getVariables(survey, nodeDef, mode)

  return {
    variables
  }
}

export default connect(mapStateToProps)(ExpressionComponent)