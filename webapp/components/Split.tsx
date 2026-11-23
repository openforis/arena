import './Split.scss'

import type React from 'react'

import ReactSplit from 'react-split'
import classNames from 'classnames'

// same as $paneResizeHandleWidth (layoutMixins.scss)
const GUTTER_SIZE = 12

type SplitProps = {
  children: React.ReactNode
  className?: string
  direction?: 'horizontal' | 'vertical'
  expandToMin?: boolean
  minSize?: number | number[]
  sizes?: number[]
}

export const Split = (props: SplitProps) => {
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
      gutterSize={GUTTER_SIZE}
      minSize={minSize}
      sizes={sizes}
    >
      {children}
    </ReactSplit>
  )
}
