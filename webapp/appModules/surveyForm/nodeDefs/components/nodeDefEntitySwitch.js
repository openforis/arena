import '../../style/react-grid-layout.scss'

import React from 'react'
import { connect } from 'react-redux'

import NodeDefEntityTable from './nodeDefEntityTable'
import NodeDefEntityForm from './nodeDefEntityForm'

import Survey from '../../../../../common/survey/survey'

import {
  isRenderForm,
  isRenderTable,
} from '../../../../../common/survey/nodeDefLayout'

import { putNodeDefProp, } from '../../../../survey/nodeDefs/actions'
import { getSurvey } from '../../../../survey/surveyState'

class NodeDefEntitySwitch extends React.Component {

  render () {
    const {
      entry,
      nodeDef,
      childDefs,
      edit,
      nodes,
      parentNode,
      label,
      updateNode,
      setFormPageNode,
      selectedNodeUUID,
      putNodeDefProp
    } = this.props

    if (isRenderForm(nodeDef))
      return <NodeDefEntityForm entry={entry}
                                nodeDef={nodeDef}
                                childDefs={childDefs}
                                edit={edit}
                                nodes={nodes}
                                parentNode={parentNode}
                                label={label}
                                updateNode={updateNode}
                                putNodeDefProp={putNodeDefProp}/>
    else if (isRenderTable(nodeDef))
      return <NodeDefEntityTable entry={entry}
                                 nodeDef={nodeDef}
                                 childDefs={childDefs}
                                 edit={edit}
                                 nodes={nodes}
                                 parentNode={parentNode}
                                 setFormPageNode={setFormPageNode}
                                 selectedNodeUUID={selectedNodeUUID}
                                 updateNode={updateNode}
                                 putNodeDefProp={putNodeDefProp}/>

    return null
  }
}

NodeDefEntitySwitch.defaultProps = {
  entityDef: {},
  edit: false,
}

const mapStateToProps = (state, props) => ({
  childDefs: Survey.getNodeDefChildren(props.nodeDef)(getSurvey(state)),
})

export default connect(
  mapStateToProps,
  {putNodeDefProp}
)(NodeDefEntitySwitch)