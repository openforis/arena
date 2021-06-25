import './nodeDefTableCellHeader.scss'

import React, { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'

import { useI18n } from '@webapp/store/system'

import * as NodeDefUiProps from '../nodeDefUIProps'
import NodeDefIconKey from './NodeDefIconKey'

const LabelWithTooltip = (props) => {
  const { label, style, children } = props

  const labelRef = useRef(null)

  // detect when ellipsis is active and show a tooltip in that case
  const [ellipsed, setEllipsed] = useState(false)
  const tooltip = ellipsed ? label : null

  useEffect(() => {
    const labelEl = labelRef?.current
    if (labelEl) {
      setEllipsed(labelEl.offsetHeight < labelEl.scrollHeight || labelEl.offsetWidth < labelEl.scrollWidth)
    }
  }, [label])

  return (
    <div className="label ellipsis" style={style} title={tooltip} ref={labelRef}>
      {children}
      {label}
    </div>
  )
}

const NodeDefTableCellHeader = (props) => {
  const { label, nodeDef } = props

  const i18n = useI18n()

  const fields = NodeDefUiProps.getFormFields(nodeDef)

  return (
    <div
      className={`survey-form__node-def-table-cell-header survey-form__node-def-table-cell-${NodeDef.getType(nodeDef)}`}
    >
      <LabelWithTooltip label={label} style={{ gridColumn: `1 / span ${fields.length}` }}>
        <NodeDefIconKey nodeDef={nodeDef} />
      </LabelWithTooltip>

      {fields.length > 1 &&
        fields.map((field) => (
          <div key={field.field} className="label">
            {i18n.t(field.labelKey)}
          </div>
        ))}
    </div>
  )
}

NodeDefTableCellHeader.propTypes = {
  label: PropTypes.string.isRequired,
  nodeDef: PropTypes.object.isRequired,
}

export default NodeDefTableCellHeader
