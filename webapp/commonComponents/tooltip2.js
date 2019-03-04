import './tooltip2.scss'

import React from 'react'

const Tooltip = ({ children, message, className }) =>
  <span className={`tooltip2${className ? ' ' + className : ''}`}>
    {children}

    {
      message &&
      <div className="message">
        {message}
      </div>
    }
  </span>

Tooltip.defaultProps = {
  message: null,
}

export default Tooltip