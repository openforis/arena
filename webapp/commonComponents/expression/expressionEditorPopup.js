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

class ExpressionEditorPopup extends React.Component {

  constructor (props) {
    super(props)

    const { query, expr: exprParam, mode, canBeConstant } = props
    const expr = exprParam || ExpressionParser.parseQuery(query, mode, canBeConstant)

    this.state = {
      query,
      queryDraft: Expression.toString(expr, mode),
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
      isBoolean, onChange, onClose,
      variables, literalSearchParams,
    } = this.props

    return (
      <Popup
        className="expression-editor-popup"
        onClose={onClose}
        padding={20}>

        <div className="expression-editor__query-container">
          <div className={`query${exprDraftValid ? '' : ' invalid'}`}>
            {
              R.isEmpty(queryDraft)
                ? <span className="placeholder">- empty -</span>
                : queryDraft
            }
          </div>
        </div>

        <div className="expression-editor-popup__expr-container">
          <ExpressionNode variables={variables} node={exprDraft}
                          onChange={this.updateDraft.bind(this)}
                          isBoolean={isBoolean}
                          literalSearchParams={literalSearchParams}/>
        </div>

        <div className="expression-editor-popup__footer">
          <button className="btn btn-xs btn-of"
                  onClick={() => onChange('')}
                  aria-disabled={R.isEmpty(query)}>
            <span className="icon icon-undo2 icon-16px"/> Reset
          </button>

          <button className="btn btn-xs btn-of"
                  onClick={() => onChange(queryDraft, exprDraft)}
                  aria-disabled={query === queryDraft || !exprDraftValid}>
            <span className="icon icon-checkmark icon-16px"/> Apply
          </button>
        </div>

      </Popup>
    )
  }

}

ExpressionEditorPopup.defaultProps = {
  query: '',
  expr: null,
  nodeDefUuidContext: '',
  nodeDefUuidCurrent: null,
  mode: Expression.modes.json,
  isContextParent: false,
  canBeConstant: false,
  isBoolean: true,

  literalSearchParams: null,
  onClose: _ => {},
  onChange: _ => {},
}

const mapStateToProps = (state, props) => {
  const survey = SurveyState.getSurvey(state)

  const {
    nodeDefUuidContext,
    nodeDefUuidCurrent,
    mode = ExpressionEditorPopup.defaultProps.mode,
    isContextParent = ExpressionEditorPopup.defaultProps.isContextParent,
  } = props

  const nodeDefContext = Survey.getNodeDefByUuid(nodeDefUuidContext)(survey)
  const nodeDefCurrent = nodeDefUuidCurrent ? Survey.getNodeDefByUuid(nodeDefUuidCurrent)(survey) : null
  const depth = isContextParent ? 0 : 1
  const variables = ExpressionVariables.getVariables(survey, nodeDefContext, nodeDefCurrent, mode, depth)

  const literalSearchParams = ExpressionParser.getLiteralSearchParams(survey, nodeDefCurrent)

  return {
    variables,
    literalSearchParams,
  }
}

export default connect(mapStateToProps)(ExpressionEditorPopup)