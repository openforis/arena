import React, { forwardRef, useCallback } from 'react'
import axios from 'axios'

import { Button, ButtonProps } from '@webapp/components/buttons'
import * as DomUtils from '@webapp/utils/domUtils'

type ButtonDownloadProps = Omit<ButtonProps, 'onClick'> & {
  downloadInMemory?: boolean
  fileName?: string | null
  href?: string | null
  onClick?: () => boolean | void | Promise<boolean | void>
  requestParams?: Record<string, unknown> | null
}

export const ButtonDownload = forwardRef<HTMLButtonElement, ButtonDownloadProps>((props, ref) => {
  const {
    downloadInMemory = true,
    fileName = null,
    href = null,
    iconClassName = 'icon-download2 icon-14px',
    label = 'common.download',
    onClick: onClickProp,
    requestParams = null,
    variant = 'outlined',
    ...otherProps
  } = props

  const handleDownloadInMemory = useCallback(async () => {
    const response = await axios.get(href, {
      params: requestParams,
      responseType: 'blob',
    })

    const contentDisposition: string | undefined = response.headers['content-disposition']
    const extractedFileName = contentDisposition?.split('filename=')[1]?.replaceAll('"', '')

    DomUtils.downloadBlobToFile(response.data, fileName ?? extractedFileName ?? 'download')
  }, [href, requestParams, fileName])

  const onClick = useCallback(async () => {
    let onClickResult: boolean | void
    if (onClickProp) {
      onClickResult = await onClickProp()
    }
    if (href && onClickResult !== false) {
      if (downloadInMemory) {
        await handleDownloadInMemory()
      } else {
        let url = href
        if (requestParams) {
          const params = new URLSearchParams(requestParams as Record<string, string>)
          url += `?${params.toString()}`
        }
        globalThis.open(url, '_blank')
      }
    }
  }, [downloadInMemory, handleDownloadInMemory, href, onClickProp, requestParams])

  return (
    <Button iconClassName={iconClassName} label={label} onClick={onClick} ref={ref} variant={variant} {...otherProps} />
  )
})

ButtonDownload.displayName = 'ButtonDownload'
