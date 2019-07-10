import React from 'react'
import { connect } from 'react-redux'

import NodeDefEntityTable from './nodeDefEntityTable'
import NodeDefEntityForm from './nodeDefEntityForm'

import Survey from '../../../../../../../common/survey/survey'
import NodeDefLayout from '../../../../../../../common/survey/nodeDefLayout'

import * as SurveyState from '../../../../../../survey/surveyState'

import { putNodeDefProp } from '../../../../../../survey/nodeDefs/actions'

class NodeDefEntitySwitch extends React.Component {

  render () {
    const {
      edit,
      entry,
      surveyInfo,
      nodeDef,
      childDefs,
      nodes,
      parentNode,
      label,
      updateNode,
      setFormPageNode,
      selectedNodeUuid,
      putNodeDefProp,
      removeNode,
      locked,
      canEditDef,
      canEditRecord,
      canAddNode,
    } = this.props

    if (NodeDefLayout.isRenderForm(nodeDef))
      return <NodeDefEntityForm label={label}
                                surveyInfo={surveyInfo}
                                nodeDef={nodeDef}
                                childDefs={childDefs}
                                edit={edit}
                                entry={entry}
                                nodes={nodes}
                                parentNode={parentNode}
                                updateNode={updateNode}
                                putNodeDefProp={putNodeDefProp}
                                locked={locked}
                                canEditDef={canEditDef}
                                canEditRecord={canEditRecord}
                                canAddNode={canAddNode}
                                removeNode={removeNode}/>
    else if (NodeDefLayout.isRenderTable(nodeDef))
      return <NodeDefEntityTable label={label}
                                 surveyInfo={surveyInfo}
                                 nodeDef={nodeDef}
                                 childDefs={childDefs}
                                 edit={edit}
                                 entry={entry}
                                 nodes={nodes}
                                 parentNode={parentNode}
                                 setFormPageNode={setFormPageNode}
                                 selectedNodeUuid={selectedNodeUuid}
                                 updateNode={updateNode}
                                 putNodeDefProp={putNodeDefProp}
                                 removeNode={removeNode}
                                 locked={locked}
                                 canEditDef={canEditDef}
                                 canEditRecord={canEditRecord}
                                 canAddNode={canAddNode}/>

    return null
  }
}

const mapStateToProps = (state, props) => ({
  childDefs: Survey.getNodeDefChildren(props.nodeDef)(SurveyState.getSurvey(state)),
})

export default connect(
  mapStateToProps,
  { putNodeDefProp }
)(NodeDefEntitySwitch)