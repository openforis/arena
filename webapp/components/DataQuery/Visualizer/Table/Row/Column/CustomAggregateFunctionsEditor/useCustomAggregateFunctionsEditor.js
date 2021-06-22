import { useState } from 'react'
import { useDispatch } from 'react-redux'

import { AggregateFunction } from '@core/survey/aggregateFunction'
import * as NodeDef from '@core/survey/nodeDef'

import { DialogConfirmActions } from '@webapp/store/ui'
import { NodeDefsActions } from '@webapp/store/survey'

export const useCustomAggregateFunctionsEditor = (props) => {
  const { nodeDef } = props

  const dispatch = useDispatch()
  const [editedUuid, setEditedUuid] = useState(null)

  const [customAggregateFunctions, setCustomAggregateFunctions] = useState(NodeDef.getAggregateFunctions(nodeDef))

  const onNew = () => {
    const newFn = AggregateFunction.newAggregateFunction()
    setCustomAggregateFunctions([...customAggregateFunctions, newFn])
    setEditedUuid(newFn.uuid)
  }

  const onEditCancel = (fn) => {
    const { uuid, placeholder } = fn
    if (placeholder) {
      const functionsUpdated = customAggregateFunctions.filter((f) => f.uuid !== uuid)
      setCustomAggregateFunctions(functionsUpdated)
    }
    setEditedUuid(null)
  }

  const onSave = (fnUpdated) => {
    const { placeholder, ...fnToSave } = fnUpdated
    const fnIndex = customAggregateFunctions.findIndex((fn) => fn.uuid === fnToSave.uuid)
    const functionsUpdated = [...customAggregateFunctions]
    functionsUpdated.splice(fnIndex, 1, fnToSave)
    setCustomAggregateFunctions(functionsUpdated)
    setEditedUuid(null)

    const nodeDefUuid = NodeDef.getUuid(nodeDef)
    const parentUuid = NodeDef.getParentUuid(nodeDef)

    const propsAdvancedToUpdate = { [NodeDef.keysPropsAdvanced.aggregateFunctions]: functionsUpdated }

    // update node def server side
    dispatch(
      NodeDefsActions.putNodeDefProps({
        nodeDefUuid,
        parentUuid,
        propsAdvanced: propsAdvancedToUpdate,
      })
    )

    const nodeDefUpdated = NodeDef.mergePropsAdvanced(propsAdvancedToUpdate)(nodeDef)

    // Update redux store nodeDefs state
    dispatch(NodeDefsActions.updateNodeDef({ nodeDef: nodeDefUpdated }))
  }

  const onDelete = (fnToDelete) => {
    dispatch(
      DialogConfirmActions.showDialogConfirm({
        key: 'dataExplorerView.customAggregateFunction.confirmDelete',
        onOk: async () => {
          const fnIndex = customAggregateFunctions.findIndex((fn) => fn.uuid === fnToDelete.uuid)
          const functionsUpdated = [...customAggregateFunctions]
          functionsUpdated.splice(fnIndex, 1)
          setCustomAggregateFunctions(functionsUpdated)
          setEditedUuid(null)
        },
      })
    )
  }

  return {
    customAggregateFunctions,
    editedUuid,
    setEditedUuid,
    onDelete,
    onNew,
    onSave,
    onEditCancel,
  }
}
