import './nodeDefEntityForm.scss'

import React, { useEffect } from 'react'
import { connect, useDispatch } from 'react-redux'
import * as R from 'ramda'

import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'

import { RecordState } from '@webapp/store/ui/record'
import { SurveyFormActions, SurveyFormState } from '@webapp/store/ui/surveyForm'

import NodeDefErrorBadge from '@webapp/components/survey/SurveyForm/nodeDefs/components/nodeDefErrorBadge'

import NodeDefEntityFormGrid from './nodeDefEntityFormGrid'
import NodeDefEntityFormNodeSelect from './nodeDefEntityFormNodeSelect'

const NodeDefEntityForm = (props) => {
  const { nodeDef, nodes, parentNode, selectedNode, edit, entry, entryMultiple } = props

  const dispatch = useDispatch()

  useEffect(() => {
    if (entry && NodeDef.isSingle(nodeDef)) {
      const nodeUuid = R.pipe(R.head, Node.getUuid)(nodes)
      dispatch(SurveyFormActions.setFormPageNode(nodeDef, nodeUuid))
    }
  }, [NodeDef.getUuid(nodeDef)])

  return (
    <div>
      <NodeDefErrorBadge nodeDef={nodeDef} edit={edit} parentNode={parentNode} nodes={nodes} />

      {entryMultiple && (
        <NodeDefEntityFormNodeSelect
          {...props}
          selectedNode={selectedNode}
          onChange={(selectedNodeUuid) => dispatch(SurveyFormActions.setFormPageNode(nodeDef, selectedNodeUuid))}
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

export default connect(mapStateToProps)(NodeDefEntityForm)
