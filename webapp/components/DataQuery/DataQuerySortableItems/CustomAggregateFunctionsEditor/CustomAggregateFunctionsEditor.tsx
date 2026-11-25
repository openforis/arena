import './CustomAggregateFunctionsEditor.scss'

import type { ArenaAnyNodeDef } from '@openforis/arena-core'

import { ButtonNew } from '@webapp/components'
import { useI18n } from '@webapp/store/system'

import { CustomAggregateFunctionEditor } from './CustomAggregateFunctionEditor'
import { CustomAggregateFunctionViewer } from './CustomAggregateFunctionViewer'
import { useCustomAggregateFunctionsEditor } from './useCustomAggregateFunctionsEditor'

type CustomAggregateFunctionsEditorProps = {
  entityDef: ArenaAnyNodeDef
  nodeDef: ArenaAnyNodeDef
  selectedUuids?: any[]
  onSelectionChange?: (...args: any[]) => any
}

export const CustomAggregateFunctionsEditor = (props: CustomAggregateFunctionsEditorProps) => {
  const { entityDef, nodeDef, selectedUuids = [], onSelectionChange = () => {} } = props

  const i18n = useI18n()
  const { customAggregateFunctionsArray, editedUuid, setEditedUuid, onDelete, onNew, onSave, onEditCancel } =
    useCustomAggregateFunctionsEditor(props)

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
            {customAggregateFunctionsArray.map((aggregateFunction) => {
              const { uuid } = aggregateFunction
              const editing = editedUuid === uuid

              return (
                <div key={uuid} className="table__row">
                  {editing ? (
                    <CustomAggregateFunctionEditor
                      aggregateFunction={aggregateFunction}
                      entityDef={entityDef}
                      nodeDef={nodeDef}
                      onCancel={onEditCancel}
                      onDelete={onDelete}
                      onSave={onSave}
                    />
                  ) : (
                    <CustomAggregateFunctionViewer
                      fn={aggregateFunction}
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
      <ButtonNew onClick={onNew} />
    </fieldset>
  )
}
