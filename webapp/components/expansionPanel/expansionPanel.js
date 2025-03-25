import './expansionPanel.scss'
import React, { useEffect, useMemo, useRef } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { useI18n } from '@webapp/store/system'
import { Button } from '../buttons'

const closeClassName = 'close'

const ExpansionPanel = (props) => {
  const {
    buttonLabel = '',
    buttonLabelParams = undefined,
    children,
    className: classNameProp = null,
    open = undefined,
    showHeader = true,
    startClosed = false,
  } = props
  const i18n = useI18n()
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
        <div className="expansion-panel__header" onClick={toggleCloseState}>
          <Button className="btn-xs btn-transparent btn-toggle" iconClassName="icon-play3 icon-10px" variant="text" />
          {i18n.t(buttonLabel, buttonLabelParams)}
        </div>
      )}

      <div className="expansion-panel__content" ref={contentRef}>
        {React.Children.toArray(children)}
      </div>
    </div>
  )
}

ExpansionPanel.propTypes = {
  buttonLabel: PropTypes.string,
  buttonLabelParams: PropTypes.object,
  children: PropTypes.node,
  className: PropTypes.string,
  open: PropTypes.bool,
  showHeader: PropTypes.bool,
  startClosed: PropTypes.bool,
}

export default ExpansionPanel
