import './NodeDefEntityForm.scss'

import { useEffect } from 'react'
import { connect } from 'react-redux'

import * as A from '@core/arena'
import * as Node from '@core/record/node'
import * as Record from '@core/record/record'
import * as NodeDef from '@core/survey/nodeDef'
import NodeDefErrorBadge from '@webapp/components/survey/SurveyForm/nodeDefs/components/NodeDefErrorBadge'
import { useAppDispatch } from '@webapp/store'
import { RecordState } from '@webapp/store/ui/record'
import { SurveyFormActions, SurveyFormState } from '@webapp/store/ui/surveyForm'

import NodeDefEntityFormGrid from './NodeDefEntityFormGrid'
import NodeDefEntityFormNodeSelect from './NodeDefEntityFormNodeSelect'

const NodeDefEntityForm = (props) => {
  const {
    edit,
    nodeDef = null,
    parentNode,
    // Entry props
    entry = false,
    entryMultiple = false,
    nodes = null,
    selectedNode = null,
  } = props

  const dispatch = useAppDispatch()

  // when there is no entity selected, select the first one
  useEffect(() => {
    if (entry && !selectedNode && !A.isEmpty(nodes)) {
      const nodeUuid = A.pipe(A.head, Node.getUuid)(nodes)
      if (nodeUuid) {
        dispatch(SurveyFormActions.setFormPageNode(nodeDef, nodeUuid))
      }
    }
  }, [entry, selectedNode, nodes, NodeDef.getUuid(nodeDef)])

  return (
    <>
      <NodeDefErrorBadge nodeDef={nodeDef} edit={edit} parentNode={parentNode} nodes={nodes} />

      {entryMultiple && (
        <NodeDefEntityFormNodeSelect
          {...props}
          selectedNode={selectedNode}
          onChange={(selectedNodeUuid) => dispatch(SurveyFormActions.setFormPageNode(nodeDef, selectedNodeUuid))}
        />
      )}

      {(edit || (entry && selectedNode)) && <NodeDefEntityFormGrid {...props} node={selectedNode} />}
    </>
  )
}

const mapStateToProps = (state, props) => {
  const { nodeDef, entry } = props

  const record = RecordState.getRecord(state)

  const getEntryProps = () => {
    const entryMultiple = NodeDef.isMultiple(nodeDef)

    const selectedNodeUuid = SurveyFormState.getFormPageNodeUuid(nodeDef)(state)

    const selectedNode = selectedNodeUuid ? Record.getNodeByUuid(selectedNodeUuid)(record) : null

    return {
      entryMultiple,
      selectedNode,
    }
  }

  return entry && record ? getEntryProps() : {}
}

export default connect(mapStateToProps)(NodeDefEntityForm)
