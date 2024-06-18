import './panelRight.scss'

import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { TestId } from '@webapp/utils/testId'

import { Button, ButtonIconClose } from '../buttons'

const PanelRight = (props) => {
  const { children, className, header, onClose, showFooter, width } = props

  return ReactDOM.createPortal(
    <div
      className={classNames('panel-right', { 'with-footer': showFooter }, className)}
      style={{ width: `min(${width}, 100vw)` }}
    >
      <div className="panel-right__header">
        <ButtonIconClose className="btn-close" onClick={onClose} testId={TestId.panelRight.closeBtn} />
        <div>{header}</div>
      </div>
      <div className="panel-right__content">{React.Children.toArray(children)}</div>
      {showFooter && (
        <div className="panel-right__footer">
          <Button className="btn-close-footer" label="common.close" onClick={onClose} primary />
        </div>
      )}
    </div>,
    document.body
  )
}

PanelRight.propTypes = {
  className: PropTypes.string,
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.arrayOf(PropTypes.node)]).isRequired,
  header: PropTypes.node,
  onClose: PropTypes.func.isRequired,
  showFooter: PropTypes.bool,
  width: PropTypes.string, // width of the panel (e.g. '1000px' or '90vw')
}

PanelRight.defaultProps = {
  className: null,
  header: '',
  showFooter: false,
  width: '500px',
}

export default PanelRight
