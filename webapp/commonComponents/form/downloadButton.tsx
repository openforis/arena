import React from 'react'
import axios from 'axios'
import * as R from 'ramda'
import * as FileSaver from 'file-saver'

import { useI18n } from '../hooks'

const DownloadButton = props => {

  const i18n = useI18n()

  const {
    href, label = i18n.t('common.download'), title,
    className, showLabel, disabled
  } = props

  return (
    <a
      className={`btn btn-s ${className}`}
      aria-disabled={disabled}
      title={title}
      onClick={async () => {
        const response = await axios({ url: href, method: 'GET', responseType: 'blob' })
        const blob = new Blob([response.data])
        const contentDisposition = R.path(['headers', 'content-disposition'], response) as string;
        const fileName = contentDisposition.substring('attachment; filename='.length)
        FileSaver.saveAs(blob, fileName)
      }}>
      <span className={`icon icon-download2 icon-14px${showLabel && label ? ' icon-left' : ''}`}/>
      {showLabel && label}
    </a>
  )
}

DownloadButton.defaultProps = {
  href: null,
  label: null,
  title: null,
  className: '',
  showLabel: true,
  disabled: false,
}

export default DownloadButton
