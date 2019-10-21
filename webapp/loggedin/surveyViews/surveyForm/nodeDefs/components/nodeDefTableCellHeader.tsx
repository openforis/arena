import './nodeDefTableCellHeader.scss'

import React from 'react'

import { useI18n } from '../../../../../commonComponents/hooks'

import NodeDef from '../../../../../../core/survey/nodeDef'

import {NodeDefUIProps} from '../internal'

export const NodeDefTableCellHeader = props => {
  const { label, nodeDef } = props

  const fields = NodeDefUIProps.getFormFields(nodeDef)

  const i18n = useI18n()

  return (
    <div className={`survey-form__node-def-table-cell-header survey-form__node-def-table-cell-${NodeDef.getType(nodeDef)}`}>

      <label style={{ gridColumn: `1 / span ${fields.length}` }}>{label}</label>

      {
        fields.length > 1 &&
        fields.map(field =>
          <label key={field.field}>
            {i18n.t(field.labelKey)}
          </label>
        )
      }

    </div>

  )
}

export default NodeDefTableCellHeader
