import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import Survey from '../../../../../common/survey/survey'
import NodeDef from '../../../../../common/survey/nodeDef'
import * as SurveyState from '../../../../survey/surveyState'

import * as NodeDefUiProps from '../../../surveyForm/nodeDefs/nodeDefSystemProps'

const VariablesSelectorEntity = ({nodeDef, lang}) => (
  <React.Fragment>
    <div>{NodeDef.getNodeDefLabel(nodeDef, lang)}</div>
    <VariablesSelectorConnect nodeDefUuid={NodeDef.getUuid(nodeDef)}/>
  </React.Fragment>
)

class VariablesSelector extends React.Component {
  render () {
    const {nodeDefParent, childDefs, lang} = this.props

    return childDefs
      ? (
        <div>
          {
            childDefs.map(nodeDef => NodeDef.isNodeDefEntity(nodeDef) ?
              null :
              <button key={nodeDef.id} className="btn btn-of-light">
                {NodeDefUiProps.getNodeDefIconByType(NodeDef.getNodeDefType(nodeDef))}
                {NodeDef.getNodeDefLabel(nodeDef, lang)}
              </button>
            )
          }
          {
            nodeDefParent &&
            <VariablesSelectorEntity nodeDef={nodeDefParent} lang={lang}/>
          }
        </div>
      )
      : null
  }
}

VariablesSelector.defaultProps = {
  entityUuid: null,
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
    lang: Survey.getDefaultLanguage(survey)
  }
}

const VariablesSelectorConnect = connect(mapStateToProps)(VariablesSelector)
export default VariablesSelectorConnect