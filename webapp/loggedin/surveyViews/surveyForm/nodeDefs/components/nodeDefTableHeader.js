import React from 'react'

import NodeDef from '../../../../../../common/survey/nodeDef'

import * as NodeDefUiProps from '../nodeDefSystemProps'

import useI18n from '../../../../../commonComponents/useI18n'

const NodeDefTableHeader = props => {
  const { label, nodeDef } = props

  const fields = NodeDefUiProps.getNodeDefFormFields(nodeDef)

  const i18n = useI18n()

  return (
    <div className={`node-def__table-column-header node-def__table-row-${NodeDef.getType(nodeDef)}`}>

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

export default NodeDefTableHeader