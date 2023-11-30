import React, { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

const TOLERANCE = 2 // pixels of tolerance when considering text as ellipsed

export const LabelWithTooltip = (props) => {
  const { className, label, style, children } = props

  const labelRef = useRef(null)

  // detect when ellipsis is active and show a tooltip in that case
  const [tooltip, setTooltip] = useState(null)

  useEffect(() => {
    const labelEl = labelRef?.current
    if (labelEl) {
      const ellipsedNext =
        labelEl.offsetHeight < labelEl.scrollHeight - TOLERANCE || labelEl.offsetWidth < labelEl.scrollWidth - TOLERANCE
      if (ellipsedNext) {
        setTooltip(label)
      }
    }
  }, [label])

  return (
    <div className={classNames(className, 'label', 'ellipsis')} style={style} title={tooltip} ref={labelRef}>
      {children}
      {label}
    </div>
  )
}

LabelWithTooltip.propTypes = {
  className: PropTypes.string,
  label: PropTypes.string,
  style: PropTypes.object,
  children: PropTypes.node,
}

LabelWithTooltip.defaultProps = {
  className: undefined,
  label: '',
  style: {},
  children: null,
}
