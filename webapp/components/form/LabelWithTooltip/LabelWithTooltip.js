import React, { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'

export const LabelWithTooltip = (props) => {
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

LabelWithTooltip.propTypes = {
  label: PropTypes.string.isRequired,
  style: PropTypes.object,
  children: PropTypes.node,
}

LabelWithTooltip.defaultProps = {
  style: {},
  children: null,
}
