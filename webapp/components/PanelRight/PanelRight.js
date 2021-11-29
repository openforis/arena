import './panelRight.scss'
import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import { TestId } from '@webapp/utils/testId'

const PanelRight = (props) => {
  const { children, className, header, onClose, width } = props

  return ReactDOM.createPortal(
    <div className={`panel-right ${className ? className : ''}`} style={{ width: `min(${width}, 100vw)` }}>
      <div className="panel-right__header">
        <button
          data-testid={TestId.panelRight.closeBtn}
          type="button"
          className="btn btn-transparent btn-close"
          onClick={onClose}
        >
          <span className="icon icon-cross icon-12px" />
        </button>
        <div>{header}</div>
      </div>
      <div className="panel-right__content">{React.Children.toArray(children)}</div>
    </div>,
    document.body
  )
}

PanelRight.propTypes = {
  className: PropTypes.string,
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.arrayOf(PropTypes.node)]).isRequired,
  header: PropTypes.node,
  onClose: PropTypes.func.isRequired,
  width: PropTypes.string, // width of the panel (e.g. '1000px' or '90vw')
}

PanelRight.defaultProps = {
  className: null,
  header: '',
  width: '500px',
}

export default PanelRight
