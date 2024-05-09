import './CustomAggregateFunctionsEditor.scss'

import React from 'react'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'

import { ButtonNew } from '@webapp/components'
import { CustomAggregateFunctionEditor } from './CustomAggregateFunctionEditor'
import { CustomAggregateFunctionViewer } from './CustomAggregateFunctionViewer'
import { useCustomAggregateFunctionsEditor } from './useCustomAggregateFunctionsEditor'

export const CustomAggregateFunctionsEditor = (props) => {
  const { entityDef, nodeDef, selectedUuids, onSelectionChange } = props

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

CustomAggregateFunctionsEditor.propTypes = {
  entityDef: PropTypes.object.isRequired,
  nodeDef: PropTypes.object.isRequired,
  selectedUuids: PropTypes.array,
  onSelectionChange: PropTypes.func,
}

CustomAggregateFunctionsEditor.defaultProps = {
  selectedUuids: [],
  onSelectionChange: () => {},
}
