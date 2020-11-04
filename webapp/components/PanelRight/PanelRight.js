import './panelRight.scss'
import React, { useState } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

const PanelRight = (props) => {
  const { children, header, onClose, width } = props
  const [expanded, setExpanded] = useState(false)
  const toggleExpanded = () => setExpanded(!expanded)

  return (
    <div className="panel-right" style={{ width: `min(${expanded ? '100vw' : width}, 100vw)` }}>
      <div className="panel-right__header">
        <button type="button" className="btn btn-transparent btn-close" onClick={onClose}>
          <span className="icon icon-cross icon-12px" />
        </button>
        <div>{header}</div>
        <button type="button" className="btn btn-transparent btn-resize" onClick={toggleExpanded}>
          <span
            className={classNames('icon icon-12px', {
              'icon-shrink2': expanded,
              'icon-enlarge2': !expanded,
            })}
          />
        </button>
      </div>
      <div className="panel-right__content">{React.Children.toArray(children)}</div>
    </div>
  )
}

PanelRight.propTypes = {
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.arrayOf(PropTypes.node)]).isRequired,
  header: PropTypes.node,
  onClose: PropTypes.func.isRequired,
  width: PropTypes.string, // width of the panel (e.g. '1000px' or '90vw')
}

PanelRight.defaultProps = {
  header: '',
  width: '500px',
}

export default PanelRight
