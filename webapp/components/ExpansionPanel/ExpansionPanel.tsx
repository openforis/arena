import './ExpansionPanel.scss'

import React, { useEffect, useMemo, useRef } from 'react'
import classNames from 'classnames'

import { AppIcon } from '@webapp/components/AppIcon'
import { useI18nT } from '@webapp/store/system'

const closeClassName = 'close'

type ExpansionPanelProps = {
  buttonLabel?: string
  buttonLabelParams?: Record<string, any>
  children?: React.ReactNode
  className?: string
  open?: boolean
  showHeader?: boolean
  startClosed?: boolean
}

const ExpansionPanel = (props: ExpansionPanelProps) => {
  const {
    buttonLabel = '',
    buttonLabelParams = undefined,
    children,
    className: classNameProp = null,
    open = undefined,
    showHeader = true,
    startClosed = false,
  } = props
  const t = useI18nT()
  const panelRef = useRef(null)
  const contentRef = useRef(null)

  const toggleCloseState = () => {
    panelRef.current.classList.toggle(closeClassName)
  }

  useEffect(() => {
    if (startClosed) {
      toggleCloseState()
    }
  }, [])

  useEffect(() => {
    if (open === undefined) return

    const panelIsOpen = !panelRef.current.classList.contains(closeClassName)
    if (open !== panelIsOpen) {
      toggleCloseState()
    }
  }, [open])

  const className = useMemo(() => classNames('expansion-panel', classNameProp), [classNameProp])

  return (
    <div className={className} ref={panelRef}>
      {showHeader && (
        <button type="button" className="expansion-panel__header" onClick={toggleCloseState}>
          <span className="btn-toggle">
            <AppIcon name="play" size={12} />
          </span>
          {t(buttonLabel, buttonLabelParams)}
        </button>
      )}

      <div className="expansion-panel__content" ref={contentRef}>
        {React.Children.toArray(children)}
      </div>
    </div>
  )
}

export default ExpansionPanel
