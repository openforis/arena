import './expressionBuilder.scss'

import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'
import memoize from 'memoize-one'

import ExpressionEditor from './editor/expressionEditor'

import * as SurveyState from '../../survey/surveyState'
import Survey from '../../../common/survey/survey'
import NodeDef from '../../../common/survey/nodeDef'
import NodeDefTable from '../../../common/surveyRdb/nodeDefTable'
import sqlTypes from '../../../common/surveyRdb/sqlTypes'

import { elementOffset } from '../../appUtils/domUtils'

class ExpressionBuilder extends React.Component {

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
    const {query, variables} = this.props
    const {edit} = this.state

    return <div className={`expression-builder${edit ? ' edit' : ''}`}
                ref={this.elementRef}
                style={this.getStyle(edit)}>
      {
        edit
          ? (
            <ExpressionEditor query={query}
                              variables={variables}
                              onClose={this.toggleEdit}
                              onChange={query => this.applyChange(query)}/>
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
      R.map(nodeDef => {
          if (NodeDef.isNodeDefEntity(nodeDef))
            return null
          const colNames = NodeDefTable.getColNames(nodeDef)
          return colNames.map(col => ({
            label: NodeDef.getNodeDefLabel(nodeDef, lang) + (colNames.length === 1 ? '' : NodeDefTable.extractColName(nodeDef, col)),
            type: NodeDef.isNodeDefInteger(nodeDef) ? sqlTypes.integer :
              NodeDef.isNodeDefDecimal(nodeDef) ? sqlTypes.decimal
                : sqlTypes.varchar,
            value: col,
          }))
        }
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