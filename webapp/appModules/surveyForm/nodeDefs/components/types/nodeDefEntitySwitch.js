import React from 'react'
import { connect } from 'react-redux'

import NodeDefEntityTable from './nodeDefEntityTable'
import NodeDefEntityForm from './nodeDefEntityForm'

import Survey from '../../../../../../common/survey/survey'

import {
  isRenderForm,
  isRenderTable,
} from '../../../../../../common/survey/nodeDefLayout'

import { putNodeDefProp, } from '../../../../../survey/nodeDefs/actions'
import { getSurvey } from '../../../../../survey/surveyState'

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
    } = this.props

    if (isRenderForm(nodeDef))
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
                                removeNode={removeNode}/>
    else if (isRenderTable(nodeDef))
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
                                 canEditRecord = {canEditRecord}/>

    return null
  }
}

const mapStateToProps = (state, props) => ({
  childDefs: Survey.getNodeDefChildren(props.nodeDef)(getSurvey(state)),
})

export default connect(
  mapStateToProps,
  {putNodeDefProp}
)(NodeDefEntitySwitch)