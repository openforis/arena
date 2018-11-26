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
      entry,
      surveyInfo,
      nodeDef,
      childDefs,
      edit,
      nodes,
      parentNode,
      label,
      updateNode,
      setFormPageNode,
      selectedNodeUUID,
      putNodeDefProp,
      removeNode,
      locked,
      canEditDef,
    } = this.props

    if (isRenderForm(nodeDef))
      return <NodeDefEntityForm label={label}
                                entry={entry}
                                surveyInfo={surveyInfo}
                                nodeDef={nodeDef}
                                childDefs={childDefs}
                                edit={edit}
                                nodes={nodes}
                                parentNode={parentNode}
                                updateNode={updateNode}
                                putNodeDefProp={putNodeDefProp}
                                locked={locked}
                                canEditDef={canEditDef}/>
    else if (isRenderTable(nodeDef))
      return <NodeDefEntityTable label={label}
                                 entry={entry}
                                 surveyInfo={surveyInfo}
                                 nodeDef={nodeDef}
                                 childDefs={childDefs}
                                 edit={edit}
                                 nodes={nodes}
                                 parentNode={parentNode}
                                 setFormPageNode={setFormPageNode}
                                 selectedNodeUUID={selectedNodeUUID}
                                 updateNode={updateNode}
                                 putNodeDefProp={putNodeDefProp}
                                 removeNode={removeNode}
                                 locked={locked}
                                 canEditDef={canEditDef}/>

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