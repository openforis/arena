import './CustomAggregateFunctionsEditor.scss'

import React, { useState } from 'react'
import PropTypes from 'prop-types'

import { FormItem, Input } from '@webapp/components/form/Input'
import { useI18n } from '@webapp/store/system'
import Checkbox from '@webapp/components/form/checkbox'
import * as StringUtils from '@core/stringUtils'

const CustomAggregateFunctionEditor = (props) => {
  const { fn, onFnChange, onCancel } = props

  const [name, setName] = useState(fn.name)
  const [expression, setExpression] = useState(fn.expression)

  const i18n = useI18n()

  return (
    <div className="form">
      <FormItem label={i18n.t('common.name')}>
        <Input value={name} onChange={(value) => setName(StringUtils.normalizeName(value))} />
      </FormItem>
      <FormItem label={i18n.t('common.expression')}>
        <textarea rows="4" value={expression} onChange={(e) => setExpression(e.target.value)} />
      </FormItem>
      <div className="button-bar">
        <button type="button" className="btn btn-primary" onClick={() => onFnChange({ name, expression })}>
          <span className="icon icon-floppy-disk icon-left icon-12px" />
          {i18n.t('common.save')}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          {i18n.t('common.cancel')}
        </button>
      </div>
    </div>
  )
}

const CustomAggregateFunctionViewer = ({ fn, selected, onSelectionChange, setEditedUuid }) => {
  const { name, uuid } = fn
  return (
    <>
      <div>
        <Checkbox checked={selected} onChange={() => onSelectionChange({ [uuid]: !selected })} />
      </div>
      <div className="ellipsis">{name}</div>
      <button type="button" onClick={() => setEditedUuid(uuid)}>
        <span className="icon icon-pencil2 icon-14px" />
      </button>
    </>
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
                      onFnChange={(fnUpdated) => setEditedUuid(null)}
                      onCancel={() => setEditedUuid(null)}
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
    </fieldset>
  )
}

CustomAggregateFunctionsEditor.defaultProps = {
  selectedUuids: [],
  onSelectionChange: () => {},
}
