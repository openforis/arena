import { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'

import * as A from '@core/arena'
import { AggregateFunction } from '@core/survey/aggregateFunction'
import * as NodeDef from '@core/survey/nodeDef'

import { DialogConfirmActions } from '@webapp/store/ui'
import { NodeDefsActions } from '@webapp/store/survey'

export const useCustomAggregateFunctionsEditor = (props) => {
  const { nodeDef, onSelectionChange } = props

  const dispatch = useDispatch()
  const [editedUuid, setEditedUuid] = useState(null)

  const [customAggregateFunctions, setCustomAggregateFunctions] = useState(NodeDef.getAggregateFunctions(nodeDef))
  const customAggregateFunctionsArray = Object.values(customAggregateFunctions).sort(
    (fn1, fn2) => fn1.dateCreated - fn2.dateCreated
  )
  const onNew = useCallback(() => {
    const newFn = AggregateFunction.newAggregateFunction()
    setCustomAggregateFunctions({ ...customAggregateFunctions, [newFn.uuid]: newFn })
    setEditedUuid(newFn.uuid)
  }, [customAggregateFunctions])

  const onEditCancel = useCallback(
    (fn) => {
      if (fn.placeholder) {
        setCustomAggregateFunctions(A.dissoc(fn.uuid)(customAggregateFunctions))
      }
      setEditedUuid(null)
    },
    [customAggregateFunctions]
  )

  const onCustomAggregateFunctionsUpdate = useCallback(
    (customAggregateFunctionsUpdated) => {
      setCustomAggregateFunctions(customAggregateFunctionsUpdated)
      setEditedUuid(null)

      const nodeDefUuid = NodeDef.getUuid(nodeDef)
      const parentUuid = NodeDef.getParentUuid(nodeDef)

      const propsAdvancedToUpdate = { [NodeDef.keysPropsAdvanced.aggregateFunctions]: customAggregateFunctionsUpdated }

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
    },
    [dispatch, nodeDef]
  )

  const onSave = useCallback(
    (fnUpdated) => {
      const { placeholder, ...fnToSave } = fnUpdated
      const customAggregateFunctionsUpdated = { ...customAggregateFunctions, [fnToSave.uuid]: fnToSave }
      onCustomAggregateFunctionsUpdate(customAggregateFunctionsUpdated)
    },
    [customAggregateFunctions, onCustomAggregateFunctionsUpdate]
  )

  const onDeleteConfirm = useCallback(
    async (fnToDelete) => {
      const { uuid } = fnToDelete
      onSelectionChange({ [uuid]: false })
      const customAggregateFunctionsUpdated = A.dissoc(uuid)(customAggregateFunctions)
      onCustomAggregateFunctionsUpdate(customAggregateFunctionsUpdated)
    },
    [customAggregateFunctions, onCustomAggregateFunctionsUpdate, onSelectionChange]
  )

  const onDelete = useCallback(
    (fnToDelete) => {
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'dataExplorerView.customAggregateFunction.confirmDelete',
          onOk: () => onDeleteConfirm(fnToDelete),
        })
      )
    },
    [dispatch, onDeleteConfirm]
  )

  return {
    customAggregateFunctionsArray,
    editedUuid,
    setEditedUuid,
    onDelete,
    onNew,
    onSave,
    onEditCancel,
  }
}
