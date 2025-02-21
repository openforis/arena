import React, { forwardRef, useCallback } from 'react'
import PropTypes from 'prop-types'

import { Button } from '@webapp/components/buttons'

export const ButtonDownload = forwardRef((props, ref) => {
  const {
    href = null,
    iconClassName = 'icon-download2 icon-14px',
    label = 'common.download',
    onClick: onClickProp,
    requestParams = null,
    variant = 'outlined',
    ...otherProps
  } = props

  const onClick = useCallback(async () => {
    if (onClickProp) {
      await onClickProp()
    } else if (href) {
      const url = `${href}${requestParams ? `?${new URLSearchParams(requestParams)}` : ''}`
      window.open(url, '_blank')
    }
  }, [href, onClickProp, requestParams])

  return (
    <Button iconClassName={iconClassName} label={label} onClick={onClick} ref={ref} variant={variant} {...otherProps} />
  )
})

ButtonDownload.propTypes = {
  ...Button.propTypes,
  href: PropTypes.string, // specify href, onClick or both
  onClick: PropTypes.func, // specify href, onClick or both
  requestParams: PropTypes.object,
}
