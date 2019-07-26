import './expressionEditorPopup.scss'

import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import Popup from '../popup'
import ExpressionNode from './nodes/expressionNode'

import Survey from '../../../common/survey/survey'
import Expression from '../../../common/exprParser/expression'

import * as SurveyState from '../../survey/surveyState'

import * as ExpressionVariables from './expressionVariables'
import * as ExpressionParser from './expressionParser'

import AppContext from '../../app/appContext'
import * as AppState from '../../app/appState'

class ExpressionEditorPopup extends React.Component {

  constructor (props) {
    super(props)

    const { query, expr: exprParam, mode, canBeConstant } = props

    // Either exprParam or expr are passed by the parent.
    const expr = exprParam || ExpressionParser.parseQuery(query, mode, canBeConstant)
    const exprString = Expression.toString(expr, mode)

    this.state = {
      query: exprString,
      queryDraft: exprString,
      expr,
      exprDraft: expr,
      exprDraftValid: true,
    }
  }

  updateDraft (exprDraft) {
    const { mode, canBeConstant } = this.props
    this.setState({
      queryDraft: Expression.toString(exprDraft, mode),
      exprDraft,
      exprDraftValid: ExpressionParser.isExprValid(exprDraft, canBeConstant),
    })
  }

  render () {
    const { query, queryDraft, exprDraft, exprDraftValid } = this.state

    const {
      nodeDefCurrent, isBoolean, variables,
      onChange, onClose,
    } = this.props

    const { i18n } = this.context

    return (
      <Popup
        className="expression-editor-popup"
        onClose={onClose}
        padding={20}>

        <div className="expression-editor__query-container">
          <div className={`query${exprDraftValid ? '' : ' invalid'}`}>
            {
              R.isEmpty(queryDraft)
                ? <span className="placeholder">- {i18n.t('common.empty')} -</span>
                : queryDraft
            }
          </div>
        </div>

        <div className="expression-editor-popup__expr-container">
          <ExpressionNode
            variables={variables}
            node={exprDraft}
            onChange={this.updateDraft.bind(this)}
            isBoolean={isBoolean}
            nodeDefCurrent={nodeDefCurrent}
          />
        </div>

        <div className="expression-editor-popup__footer">
          <button className="btn btn-xs"
                  onClick={() => onChange('')}
                  aria-disabled={R.isEmpty(query)}>
            <span className="icon icon-undo2 icon-12px"/> {i18n.t('common.reset')}
          </button>

          <button className="btn btn-xs"
                  onClick={() => onChange(queryDraft, exprDraft)}
                  aria-disabled={query === queryDraft || !exprDraftValid}>
            <span className="icon icon-checkmark icon-12px"/> {i18n.t('common.apply')}
          </button>
        </div>

      </Popup>
    )
  }

}

ExpressionEditorPopup.contextType = AppContext

ExpressionEditorPopup.defaultProps = {
  query: '', // string representing the expression
  expr: null, // AST expression
  //NOTE: One of the two above is passed on component creation
  nodeDefUuidContext: '', // entity
  nodeDefUuidCurrent: null, // attribute
  mode: Expression.modes.json,
  isContextParent: false,
  canBeConstant: false, // true if expression can be a constant value like a number or a string
  isBoolean: true, // true if expression returns a boolean condition

  literalSearchParams: null,
  onClose: _ => {},
  onChange: _ => {},
}

const mapStateToProps = (state, props) => {
  const survey = SurveyState.getSurvey(state)
  const lang = AppState.getLang(state)

  const {
    nodeDefUuidContext, nodeDefUuidCurrent,
    mode = ExpressionEditorPopup.defaultProps.mode,
    isContextParent = ExpressionEditorPopup.defaultProps.isContextParent,
  } = props

  const nodeDefContext = Survey.getNodeDefByUuid(nodeDefUuidContext)(survey)
  const nodeDefCurrent = nodeDefUuidCurrent ? Survey.getNodeDefByUuid(nodeDefUuidCurrent)(survey) : null
  const depth = isContextParent ? 0 : 1

  const variables = ExpressionVariables.getVariables(survey, nodeDefContext, nodeDefCurrent, mode, depth, lang)

  return {
    nodeDefContext,
    nodeDefCurrent,
    variables,
  }
}

export default connect(mapStateToProps)(ExpressionEditorPopup)