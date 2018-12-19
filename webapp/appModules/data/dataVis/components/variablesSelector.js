import './variablesSelector.scss'

import React from 'react'
import { connect } from 'react-redux'

import Survey from '../../../../../common/survey/survey'
import NodeDef from '../../../../../common/survey/nodeDef'

import * as SurveyState from '../../../../survey/surveyState'
import * as NodeDefUiProps from '../../../surveyForm/nodeDefs/nodeDefSystemProps'

class Variables extends React.Component {
  render () {
    const {nodeDefParent, childDefs, lang} = this.props

    return childDefs
      ? (
        <React.Fragment>
          {
            childDefs.map(nodeDef => NodeDef.isNodeDefEntity(nodeDef) ?
              null :
              <button key={nodeDef.id} className="btn btn-s btn-of-light">
                {NodeDefUiProps.getNodeDefIconByType(NodeDef.getNodeDefType(nodeDef))}
                {NodeDef.getNodeDefLabel(nodeDef, lang)}
              </button>
            )
          }

          {
            nodeDefParent &&
            <React.Fragment>
              <div className="node-def-label">{NodeDef.getNodeDefLabel(nodeDefParent, lang)}</div>
              <VariablesConnect nodeDefUuid={NodeDef.getUuid(nodeDefParent)} lang={lang}/>
            </React.Fragment>
          }

        </React.Fragment>
      )
      : null
  }
}

Variables.defaultProps = {
  nodeDefUuid: null,
  lang: null,
}

const mapStateToProps = (state, props) => {
  const {nodeDefUuid} = props
  const survey = SurveyState.getSurvey(state)
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
  const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)
  const childDefs = nodeDefUuid
    ? Survey.getNodeDefChildren(nodeDef)(survey)
    : []

  return {
    nodeDefParent,
    childDefs,
  }
}
const VariablesConnect = connect(mapStateToProps)(Variables)

class VariablesSelector extends React.PureComponent {

  render () {
    const {nodeDefUuid, lang} = this.props

    return (
      <div className="variables-selector">
        <div className="variables-selector__container">
          <VariablesConnect nodeDefUuid={nodeDefUuid} lang={lang}/>
        </div>
      </div>
    )
  }

}

VariablesSelector.defaultProps = {
  nodeDefUuid: null,
  lang: null,
}

export default VariablesSelector