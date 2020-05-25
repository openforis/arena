import './accordion.scss'
import React, { useLayoutEffect, useRef } from 'react'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/commonComponents/hooks'

const Accordion = (props) => {
  const { buttonLabel, buttonLabelParams, children, showHeader } = props
  const i18n = useI18n()
  const accordionRef = useRef(null)
  const accordionPanelRef = useRef(null)

  useLayoutEffect(() => {
    accordionPanelRef.current.style.maxHeight = `${accordionPanelRef.current.scrollHeight}px`
  }, [])

  return (
    <div className="accordion" ref={accordionRef}>
      {showHeader && (
        <div className="accordion__header">
          <button
            type="button"
            className="btn-xs btn-transparent btn-toggle"
            onClick={() => {
              const accordion = accordionRef.current
              const panel = accordionPanelRef.current
              const closed = accordion.classList.contains('close')
              accordion.classList.toggle('close')
              panel.style.maxHeight = `${closed ? panel.scrollHeight : 0}px`
            }}
          >
            <span className="icon icon-cross icon-10px" />
          </button>
          {i18n.t(buttonLabel, buttonLabelParams)}
        </div>
      )}
      <div className="accordion__panel" ref={accordionPanelRef}>
        {React.Children.toArray(children)}
      </div>
    </div>
  )
}

Accordion.propTypes = {
  buttonLabel: PropTypes.string.isRequired,
  buttonLabelParams: PropTypes.object,
  children: PropTypes.oneOfType([PropTypes.element, PropTypes.arrayOf(PropTypes.element)]).isRequired,
  showHeader: PropTypes.bool,
}

Accordion.defaultProps = {
  buttonLabelParams: {},
  showHeader: true,
}

export default Accordion
