import { useEffect, useRef, useState, type ReactNode } from 'react'
import classNames from 'classnames'

const TOLERANCE = 2 // pixels of tolerance when considering text as ellipsed

type LabelWithTooltipProps = {
  children?: ReactNode
  className?: string
  label?: string
  style?: Record<string, any>
  testId?: string
}

export const LabelWithTooltip = (props: LabelWithTooltipProps) => {
  const { className, label = '', style, testId, children } = props

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
    <div
      className={classNames(className, 'label', 'ellipsis')}
      data-testid={testId}
      style={style}
      title={tooltip}
      ref={labelRef}
    >
      {children}
      {label}
    </div>
  )
}
