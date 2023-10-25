import './TooltipNew.scss'

import React, { useCallback, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { Tooltip } from '@mui/material'

export const TooltipNew = (props) => {
  const { children, className, title: titleProp } = props

  const titleRenderer = useMemo(
    () => (titleProp && typeof titleProp === 'function' ? titleProp : () => titleProp),
    [titleProp]
  )
  const [title, setTitle] = useState(null)

  const onOpen = useCallback(() => {
    setTitle(titleRenderer())
  }, [titleRenderer])

  return (
    <Tooltip arrow classes={{ popper: classNames('arena-tooltip', className) }} onOpen={onOpen} title={title}>
      {children}
    </Tooltip>
  )
}

TooltipNew.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.func, PropTypes.node]),
}
