import './expressionBuilder.scss'

import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'
import jsep from 'jsep'
import memoize from 'memoize-one'

const keys = {
  openBracket: ' _OP_B ',
  closeBracket: ' _CL_B ',
  nullPlaceholder: ' _NULL ',
}
jsep.addUnaryOp(keys.openBracket)
jsep.addUnaryOp(keys.closeBracket)

import * as SurveyState from '../../survey/surveyState'
import Survey from '../../../common/survey/survey'
import NodeDef from '../../../common/survey/nodeDef'
import NodeDefTable from '../../../common/surveyRdb/nodeDefTable'
import { elementOffset } from '../../appUtils/domUtils'

class ExpressionBuilder extends React.Component {

  constructor (props) {
    super(props)

    const {query} = props
    this.state = {edit: false, query, expr: this.getExpr(query)}
    //TODO flat ast tree for edit

    this.elementRef = React.createRef()

    this.toggleEdit = this.toggleEdit.bind(this)
    this.getStyle = memoize(this.getStyle.bind(this))
  }

  getExpr (query) {
    const queryStr = R.pipe(
      query => R.isEmpty(query) ? ' + ' : query,
      R.replace(/\(/g, keys.openBracket),
      R.replace(/\)/g, keys.closeBracket + keys.nullPlaceholder),
    )(query)

    return jsep(queryStr)
  }

  getStyle (edit) {
    const elemOffset = edit ? elementOffset(this.elementRef.current) : null
    const padding = 20
    return elemOffset
      ? {padding, top: (elemOffset.top - padding) + 'px', left: (elemOffset.left - padding) + 'px'}
      : {}
  }

  applyChange (value) {
    const {onChange} = this.props
    onChange && onChange(value)

    this.toggleEdit()
  }

  toggleEdit () {
    this.setState(state => ({edit: !state.edit}))
  }

  render () {
    const {variables} = this.props
    const {edit, query, expr} = this.state

    return <div className={`expression-builder${edit ? ' edit' : ''}`}
                ref={this.elementRef}
                style={this.getStyle(edit)}>
      {
        edit
          ? (
            <React.Fragment>

              <button className="btn btn-of expression-builder__btn-close"
                      onClick={this.toggleEdit}>
                <span className="icon icon-cross icon-8px"/>
              </button>

              <div className="expression-builder__query-container">
                <input type="text" className="form-input query"
                       value={query}
                       onChange={e => this.setState({query: e.target.value})}/>
              </div>

              <div>{JSON.stringify(expr)}</div>

              <div className="expression-builder__footer">
                <button className="btn btn-xs btn-of"
                        onClick={() => this.applyChange('')}>
                  <span className="icon icon-undo2 icon-16px icon-left"/> Reset
                </button>

                <button className="btn btn-xs btn-of"
                        onClick={() => this.applyChange(query)}>
                  <span className="icon icon-checkmark icon-16px icon-left"/> Apply
                </button>

              </div>

            </React.Fragment>
          )
          : (
            <div className="expression-builder__query-container">
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

ExpressionBuilder.defaultProps = {
  nodeDefUuid: '',
  query: '',
  onChange: null,
}

const mapStateToProps = (state, props) => {
  const survey = SurveyState.getSurvey(state)
  const {nodeDefUuid} = props

  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
  const lang = Survey.getDefaultLanguage(survey)

  const getVariables = (nodeDef) => {
    const variables = R.pipe(
      R.map(nodeDef =>
        NodeDef.isNodeDefEntity(nodeDef)
          ? null
          : NodeDefTable.getColNames(nodeDef)
            .map(col => ({
              label: col,
              type: 'integer',
              value: col,
            }))
      ),
      R.flatten,
      R.reject(R.isNil),
    )(Survey.getNodeDefChildren(nodeDef)(survey))

    return NodeDef.isNodeDefRoot(nodeDef)
      ? variables
      : R.concat(
        variables,
        getVariables(Survey.getNodeDefParent(nodeDef)(survey))
      )
  }
  return {
    variables: getVariables(nodeDef)
  }
}

export default connect(mapStateToProps)(ExpressionBuilder)