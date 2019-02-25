import './popup.scss'

import React from 'react'

const Popup = ({ children, onClose }) => {
  return <div>
    <button className="btn btn-of popup__btn-close"
            onClick={onClose}>
      <span className="icon icon-cross icon-8px" />
    </button>

    <div className="popup-container">
      {children}
    </div>

  </div>
}

export default Popup