import './ExtraPropDefsEditor.scss'

import React from 'react'
import PropTypes from 'prop-types'

import { ExtraPropDef } from '@core/survey/extraPropDef'

import { ButtonAdd } from '@webapp/components'

import { ExtraPropDefEditor } from './ExtraPropDefEditor'
import { useExtraPropDefsEditor } from './useExtraPropDefsEditor'

export const ExtraPropDefsEditor = (props) => {
  const {
    availableDataTypes = Object.keys(ExtraPropDef.dataTypes),
    canAdd = true,
    extraPropDefs: extraPropDefsProp,
    isExtraPropDefReadOnly = null,
    onExtraPropDefDelete,
    onExtraPropDefUpdate,
  } = props

  const { extraPropDefs, readOnly, onItemAdd, onItemDelete, onItemUpdate } = useExtraPropDefsEditor({
    extraPropDefs: extraPropDefsProp,
    onExtraPropDefDelete,
    onExtraPropDefUpdate,
  })

  return (
    <div className="extra-prop-defs-editor">
      <div className="items-container">
        {extraPropDefs.map((extraPropDef, index) => (
          <ExtraPropDefEditor
            key={extraPropDef.uuid}
            availableDataTypes={availableDataTypes}
            extraPropDef={extraPropDef}
            extraPropDefs={extraPropDefs}
            index={index}
            readOnly={readOnly || isExtraPropDefReadOnly?.(extraPropDef)}
            onItemDelete={onItemDelete}
            onItemUpdate={onItemUpdate}
          />
        ))}
      </div>
      {canAdd && (
        <ButtonAdd
          className="item-add-btn"
          disabled={readOnly || extraPropDefs.some((item) => item.newItem)}
          onClick={onItemAdd}
        />
      )}
    </div>
  )
}

ExtraPropDefsEditor.propTypes = {
  availableDataTypes: PropTypes.array,
  canAdd: PropTypes.bool,
  extraPropDefs: PropTypes.array.isRequired,
  isExtraPropDefReadOnly: PropTypes.func,
  onExtraPropDefDelete: PropTypes.func.isRequired,
  onExtraPropDefUpdate: PropTypes.func.isRequired,
}
