import './popup.scss'

import React from 'react'

import { elementOffset } from '@webapp/utils/domUtils'

class Popup extends React.PureComponent {
  constructor(props) {
    super(props)

    this.state = { style: {} }
    this.elementRef = React.createRef()
  }

  getStyle() {
    const { padding } = this.props
    const elemOffset = elementOffset(this.elementRef.current)

    return {
      padding: `${padding}px`,
      top: `${elemOffset.top - padding}px`,
      left: `${elemOffset.left - padding}px`,
    }
  }

  componentDidMount() {
    this.setState({ style: this.getStyle() })
  }

  render() {
    const { children, onClose, className } = this.props
    const { style } = this.state

    return (
      <div className={`popup ${className}`} ref={this.elementRef} style={style}>
        <button className="btn popup__btn-close" onClick={onClose}>
          <span className="icon icon-cross icon-8px" />
        </button>

        {children}
      </div>
    )
  }
}

Popup.defaultProps = {
  padding: 0,
  className: '',
  onClose: () => {},
}

export default Popup
