import './expression.scss'

import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import Editor from './editor/editor'
import Popup from '../../commonComponents/popup'

import * as SurveyState from '../../survey/surveyState'
import Survey from '../../../common/survey/survey'
import NodeDef from '../../../common/survey/nodeDef'

import Expression from '../../../common/exprParser/expression'
import * as ExpressionVariables from './expressionVariables'

class ExpressionComponent extends React.Component {

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
      query, variables, mode,
      canBeConstant, isBoolean,
      literalSearchParams,
    } = this.props

    const { edit } = this.state

    return (
      <div className={`expression${edit ? ' edit' : ''}`}>

        {
          edit
            ? (
              <Popup
                onClose={this.toggleEdit}
                padding={20}>

                <Editor
                  query={query}
                  variables={variables}
                  onClose={this.toggleEdit}
                  onChange={query => this.applyChange(query)}
                  mode={mode}
                  canBeConstant={canBeConstant}
                  isBoolean={isBoolean}
                  literalSearchParams={literalSearchParams}/>

              </Popup>
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
    )
  }
}

ExpressionComponent.defaultProps = {
  nodeDefUuidContext: '',
  nodeDefUuidCurrent: null,
  query: '',
  mode: Expression.modes.json,
  onChange: null,
  isContextParent: false,
  canBeConstant: false,
  isBoolean: true,
}

const mapStateToProps = (state, props) => {
  const survey = SurveyState.getSurvey(state)
  const surveyId = SurveyState.getStateSurveyId(state)

  const {
    nodeDefUuidContext,
    nodeDefUuidCurrent,
    mode = ExpressionComponent.defaultProps.mode,
    isContextParent = ExpressionComponent.defaultProps.isContextParent,
  } = props

  const nodeDefContext = Survey.getNodeDefByUuid(nodeDefUuidContext)(survey)
  const nodeDefCurrent = nodeDefUuidCurrent ? Survey.getNodeDefByUuid(nodeDefUuidCurrent)(survey) : null
  const depth = isContextParent ? 0 : 1
  const variables = ExpressionVariables.getVariables(survey, nodeDefContext, nodeDefCurrent, mode, depth)

  const literalSearchParams = nodeDefCurrent && NodeDef.isNodeDefCode(nodeDefCurrent) ?
    {
      type: NodeDef.nodeDefType.code,
      surveyId,
      categoryUuid: NodeDef.getNodeDefCategoryUuid(nodeDefCurrent),
      categoryLevelIndex: Survey.getNodeDefCategoryLevelIndex(nodeDefCurrent)(survey),
      lang: Survey.getDefaultLanguage(Survey.getSurveyInfo(survey)),
    }
    : nodeDefCurrent && NodeDef.isNodeDefTaxon(nodeDefCurrent) ?
      {
        type: NodeDef.nodeDefType.taxon,
        surveyId,
        taxonomyUuid: NodeDef.getNodeDefTaxonomyUuid(nodeDefCurrent)
      }
      : null

  return {
    variables,
    literalSearchParams,
  }
}

export default connect(mapStateToProps)(ExpressionComponent)