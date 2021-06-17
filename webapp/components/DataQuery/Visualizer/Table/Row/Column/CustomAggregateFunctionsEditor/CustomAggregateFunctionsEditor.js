import './CustomAggregateFunctionsEditor.scss'

import React, { useState } from 'react'
import { useDispatch } from 'react-redux'

import { uuidv4 } from '@core/uuid'

import { useI18n } from '@webapp/store/system'
import { DialogConfirmActions } from '@webapp/store/ui'

import { ButtonNew } from '@webapp/components'
import { CustomAggregateFunctionEditor } from './CustomAggregateFunctionEditor'
import { CustomAggregateFunctionViewer } from './CustomAggregateFunctionViewer'

export const CustomAggregateFunctionsEditor = (props) => {
  const { selectedUuids, onSelectionChange } = props

  const dispatch = useDispatch()
  const i18n = useI18n()

  const [customAggregateFunctions, setCustomAggregateFunctions] = useState([
    { uuid: '123456', name: 'test_1' },
    { uuid: '1234567', name: 'test_2' },
  ])
  const [editedUuid, setEditedUuid] = useState(null)

  const onNewClick = () => {
    const newFn = { uuid: uuidv4(), name: '', expression: '', placeholder: true }
    setCustomAggregateFunctions([...customAggregateFunctions, newFn])
    setEditedUuid(newFn.uuid)
  }

  const onSave = (fnUpdated) => {
    const { placeholder, ...fnToSave } = fnUpdated
    const fnIndex = customAggregateFunctions.findIndex((fn) => fn.uuid === fnToSave.uuid)
    const functionsUpdated = [...customAggregateFunctions]
    functionsUpdated.splice(fnIndex, 1, fnToSave)
    setCustomAggregateFunctions(functionsUpdated)
    setEditedUuid(null)
  }

  const onEditCancel = (fn) => {
    const { uuid, placeholder } = fn
    if (placeholder) {
      const functionsUpdated = customAggregateFunctions.filter((f) => f.uuid !== uuid)
      setCustomAggregateFunctions(functionsUpdated)
    }
    setEditedUuid(null)
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

  return (
    <fieldset className="custom-aggregate-functions">
      <legend>Custom aggregate functions</legend>
      <div className="table">
        <div className="table__content">
          <div className="table__row-header">
            <div />
            <div>{i18n.t('common.name')}</div>
            <div>{i18n.t('common.edit')}</div>
          </div>
          <div className="table__rows">
            {customAggregateFunctions.map((fn) => {
              const { uuid } = fn
              const editing = editedUuid === uuid

              return (
                <div className="table__row">
                  {editing ? (
                    <CustomAggregateFunctionEditor
                      key={uuid}
                      fn={fn}
                      onCancel={onEditCancel}
                      onDelete={onDelete}
                      onSave={onSave}
                    />
                  ) : (
                    <CustomAggregateFunctionViewer
                      fn={fn}
                      selected={selectedUuids.includes(uuid)}
                      onSelectionChange={onSelectionChange}
                      setEditedUuid={setEditedUuid}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <ButtonNew onClick={onNewClick} />
    </fieldset>
  )
}

CustomAggregateFunctionsEditor.defaultProps = {
  selectedUuids: [],
  onSelectionChange: () => {},
}
