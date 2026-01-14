import React, { forwardRef, useCallback } from 'react'
import axios from 'axios'
import PropTypes from 'prop-types'

import { Button } from '@webapp/components/buttons'
import * as DomUtils from '@webapp/utils/domUtils'

export const ButtonDownload = forwardRef((props, ref) => {
  const {
    fileName = null,
    href = null,
    iconClassName = 'icon-download2 icon-14px',
    label = 'common.download',
    onClick: onClickProp,
    requestParams = null,
    variant = 'outlined',
    ...otherProps
  } = props

  const handleDownload = useCallback(async () => {
    const response = await axios.get(href, {
      params: requestParams,
      responseType: 'blob',
    })

    // Extract filename from Content-Disposition header if not provided
    const contentDisposition = response.headers['content-disposition']
    const extractedFileName = contentDisposition.split('filename=')[1]?.replace(/"/g, '')

    // Use response.data directly (it's already a Blob from axios)
    DomUtils.downloadBlobToFile(response.data, extractedFileName ?? fileName ?? 'download')
  }, [href, requestParams, fileName])

  const onClick = useCallback(async () => {
    let onClickResult
    if (onClickProp) {
      onClickResult = await onClickProp()
    }
    if (href && onClickResult !== false) {
      await handleDownload()
    }
  }, [handleDownload, href, onClickProp])

  return (
    <Button iconClassName={iconClassName} label={label} onClick={onClick} ref={ref} variant={variant} {...otherProps} />
  )
})

ButtonDownload.propTypes = {
  ...Button.propTypes,
  fileName: PropTypes.string, // required if href is specified
  href: PropTypes.string, // specify href, onClick or both
  onClick: PropTypes.func, // specify href, onClick or both. If onClick is specified and returns false, href will not be used
  requestParams: PropTypes.object,
}
