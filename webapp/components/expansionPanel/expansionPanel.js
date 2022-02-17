import './expansionPanel.scss'
import React, { useEffect, useLayoutEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { useI18n } from '@webapp/store/system'
import { Button } from '../buttons'

const ExpansionPanel = (props) => {
  const { buttonLabel, buttonLabelParams, children, className, showHeader, startClosed } = props
  const i18n = useI18n()
  const panelRef = useRef(null)
  const contentRef = useRef(null)

  const updateContentHeight = () => {
    const closed = panelRef.current.classList.contains('close')
    const content = contentRef.current
    content.style.maxHeight = `${closed ? 0 : content.scrollHeight}px`
  }

  const toggleClose = () => {
    panelRef.current.classList.toggle('close')
    updateContentHeight()
  }

  useLayoutEffect(updateContentHeight, [children])

  useEffect(() => {
    if (startClosed) {
      toggleClose()
    }
  }, [])

  return (
    <div className={classNames('expansion-panel', className)} ref={panelRef}>
      {showHeader && (
        <div className="expansion-panel__header" onClick={toggleClose}>
          <Button className="btn-xs btn-transparent btn-toggle" iconClassName="icon-play3 icon-10px" />
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
  children: PropTypes.oneOfType([PropTypes.element, PropTypes.arrayOf(PropTypes.element)]).isRequired,
  className: PropTypes.string,
  showHeader: PropTypes.bool,
  startClosed: PropTypes.bool,
}

ExpansionPanel.defaultProps = {
  buttonLabel: '',
  buttonLabelParams: {},
  className: null,
  showHeader: true,
  startClosed: false,
}

export default ExpansionPanel
