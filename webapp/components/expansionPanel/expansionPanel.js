import './expansionPanel.scss'
import React, { useLayoutEffect, useRef } from 'react'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'

const ExpansionPanel = (props) => {
  const { buttonLabel, buttonLabelParams, children, showHeader } = props
  const i18n = useI18n()
  const panelRef = useRef(null)
  const contentRef = useRef(null)

  const setContentHeight = () => {
    const content = contentRef.current
    const closed = panelRef.current.classList.contains('close')
    content.style.maxHeight = `${closed ? 0 : content.scrollHeight}px`
  }

  useLayoutEffect(setContentHeight, [])

  return (
    <div className="expansion-panel" ref={panelRef}>
      {showHeader && (
        <div className="expansion-panel__header">
          <button
            type="button"
            className="btn-xs btn-transparent btn-toggle"
            onClick={() => {
              panelRef.current.classList.toggle('close')
              setContentHeight()
            }}
          >
            <span className="icon icon-play3 icon-10px" />
          </button>
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
  showHeader: PropTypes.bool,
}

ExpansionPanel.defaultProps = {
  buttonLabel: '',
  buttonLabelParams: {},
  showHeader: true,
}

export default ExpansionPanel
