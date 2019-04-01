import React from 'react'
import { connect } from 'react-redux'

import Node from '../../../../../../common/record/node'

import NodeDefTableBody from '../../../../surveyForm/nodeDefs/components/nodeDefTableBody'

import { putNodeDefProp } from '../../../../../survey/nodeDefs/actions'
import { createNodePlaceholder, removeNode, updateNode } from '../../../../surveyForm/record/actions'

class TableColumnEdit extends React.Component {

  render () {
    const {
      nodeDef, row,
      updateNode, removeNode, createNodePlaceholder
    } = this.props

    const parentNode = {
      [Node.keys.recordUuid]: row.recordUuid,
      [Node.keys.parentUuid]: row.parentUuid
    }

    const nodes = []

    return <NodeDefTableBody
      nodeDef={nodeDef}
      parentNode={parentNode}
      nodes={nodes}
      entry={true}
      edit={false}
      updateNode={updateNode}
      removeNode={removeNode}
      createNodePlaceholder={createNodePlaceholder}
    />
  }
}

const mapStateToProps = (state, props) => {
  return {}
}

export default connect(
  mapStateToProps,
  {
    updateNode, removeNode, createNodePlaceholder
  }
)(TableColumnEdit)