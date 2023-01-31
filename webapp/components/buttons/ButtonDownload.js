import React, { useCallback } from 'react'
import PropTypes from 'prop-types'

import { Button } from '@webapp/components/buttons'

export const ButtonDownload = (props) => {
  const { href, onClick: onClickProp, requestParams, ...otherProps } = props

  const onClick = useCallback(async () => {
    if (href) {
      const url = `${href}${requestParams ? `?${new URLSearchParams(requestParams)}` : ''}`
      window.open(url, '_blank')
    }
    if (onClickProp) {
      await onClickProp()
    }
  }, [href, onClickProp, requestParams])

  return <Button {...otherProps} onClick={onClick} />
}

ButtonDownload.propTypes = {
  ...Button.propTypes,
  href: PropTypes.string, // specify href, onClick or both
  onClick: PropTypes.func, // specify href, onClick or both
  requestParams: PropTypes.object,
}

ButtonDownload.defaultProps = {
  ...Button.defaultProps,
  href: null,
  iconClassName: 'icon-download2 icon-14px',
  label: 'common.download',
}
