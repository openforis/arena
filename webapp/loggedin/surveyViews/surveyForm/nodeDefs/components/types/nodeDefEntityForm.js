import './nodeDefEntityForm.scss'

import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import NodeDefErrorBadge from '@webapp/loggedin/surveyViews/surveyForm/nodeDefs/components/nodeDefErrorBadge'

import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'

import * as SurveyFormState from '@webapp/loggedin/surveyViews/surveyForm/surveyFormState'
import { RecordState } from '@webapp/store/ui/record'

import { setFormPageNode, getNodeKeyLabelValues } from '@webapp/loggedin/surveyViews/surveyForm/actions'
import NodeDefEntityFormGrid from './nodeDefEntityFormGrid'
import NodeDefEntityFormNodeSelect from './nodeDefEntityFormNodeSelect'

const NodeDefEntityForm = (props) => {
  const {
    nodeDef,
    nodes,
    parentNode,
    selectedNode,
    edit,
    entry,
    entryMultiple,
    setFormPageNode,
    getNodeKeyLabelValues,
  } = props

  useEffect(() => {
    if (entry && NodeDef.isSingle(nodeDef)) {
      const nodeUuid = R.pipe(R.head, Node.getUuid)(nodes)
      setFormPageNode(nodeDef, nodeUuid)
    }
  }, [NodeDef.getUuid(nodeDef)])

  return (
    <div>
      <NodeDefErrorBadge nodeDef={nodeDef} edit={edit} parentNode={parentNode} nodes={nodes} />

      {entryMultiple && (
        <NodeDefEntityFormNodeSelect
          {...props}
          selectedNode={selectedNode}
          getNodeKeyLabelValues={getNodeKeyLabelValues}
          onChange={(selectedNodeUuid) => setFormPageNode(nodeDef, selectedNodeUuid)}
        />
      )}

      {entry && selectedNode && <NodeDefEntityFormGrid {...props} node={selectedNode} />}

      {edit && <NodeDefEntityFormGrid {...props} node={null} />}
    </div>
  )
}

NodeDefEntityForm.defaultProps = {
  nodeDef: null,
  // Entry props
  entry: false,
  entryMultiple: false,
  nodes: null,
  selectedNode: null,
}

const mapStateToProps = (state, props) => {
  const { nodeDef, nodes, entry } = props

  const getEntryProps = () => {
    const entryMultiple = NodeDef.isMultiple(nodeDef)
    const record = RecordState.getRecord(state)

    const selectedNodeUuid = entryMultiple
      ? SurveyFormState.getFormPageNodeUuid(nodeDef)(state)
      : Node.getUuid(nodes[0])

    const selectedNode = selectedNodeUuid ? Record.getNodeByUuid(selectedNodeUuid)(record) : null

    return {
      entryMultiple,
      selectedNode,
    }
  }

  return entry ? getEntryProps() : {}
}

export default connect(mapStateToProps, {
  setFormPageNode,
  getNodeKeyLabelValues,
})(NodeDefEntityForm)
