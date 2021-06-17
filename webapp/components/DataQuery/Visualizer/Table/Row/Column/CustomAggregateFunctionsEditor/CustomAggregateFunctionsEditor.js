import './CustomAggregateFunctionsEditor.scss'

import React, { useState } from 'react'
import PropTypes from 'prop-types'

import { FormItem, Input } from '@webapp/components/form/Input'
import { useI18n } from '@webapp/store/system'
import Checkbox from '@webapp/components/form/checkbox'

const CustomAggregateFunctionEditor = (props) => {
  const { fn } = props

  const i18n = useI18n()

  const { name } = fn

  return (
    <FormItem label={i18n.t('common.name')}>
      <Input value={name} />
    </FormItem>
  )
}

export const CustomAggregateFunctionsEditor = (props) => {
  const { selectedUuids, onSelectionChange } = props

  const i18n = useI18n()

  const customAggregateFunctions = [
    { uuid: '123456', name: 'test_1' },
    { uuid: '1234567', name: 'test_2' },
  ]
  const [editedUuid, setEditedUuid] = useState(null)

  return (
    <fieldset className="custom-aggregate-functions">
      <legend>Custom aggregate functions</legend>
      <div className="custom-aggreate-functions-table">
        <div className="table-header">
          <div />
          <div>{i18n.t('common.name')}</div>
          <div>{i18n.t('common.edit')}</div>
        </div>
        {customAggregateFunctions.map((fn) => {
          const { uuid, name } = fn
          const editing = editedUuid === uuid

          if (editing) return <CustomAggregateFunctionEditor key={fn.uuid} fn={fn} />

          const selected = selectedUuids.includes(uuid)

          return (
            <div className="table-row">
              <div>
                <Checkbox checked={selected} onChange={() => onSelectionChange({ uuid: !selected })} />
              </div>
              <div className="ellipsis">{name}</div>
              <button type="button" onClick={() => setEditedUuid(uuid)}>
                <span className="icon icon-pencil2 icon-14px" />
              </button>
            </div>
          )
        })}
      </div>
    </fieldset>
  )
}

CustomAggregateFunctionsEditor.defaultProps = {
  selectedUuids: [],
  onSelectionChange: () => {},
}
