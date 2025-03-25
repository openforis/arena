import './Split.scss'

import React from 'react'
import ReactSplit from 'react-split'
import PropTypes from 'prop-types'
import classNames from 'classnames'

export const Split = (props) => {
  const {
    className = undefined,
    children,
    direction = 'horizontal',
    expandToMin = false,
    minSize = null,
    sizes = null,
  } = props

  return (
    <ReactSplit
      className={classNames('split', className)}
      direction={direction}
      expandToMin={expandToMin}
      minSize={minSize}
      sizes={sizes}
    >
      {children}
    </ReactSplit>
  )
}

Split.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  direction: PropTypes.oneOf(['horizontal', 'vertical']),
  expandToMin: PropTypes.bool,
  minSize: PropTypes.oneOfType([PropTypes.number, PropTypes.arrayOf(PropTypes.number)]),
  sizes: PropTypes.arrayOf(PropTypes.number),
}
