import React from 'react'
import PropTypes from 'prop-types'
import axios from 'axios'
import * as R from 'ramda'
import * as FileSaver from 'file-saver'

import { useI18n } from '@webapp/store/system'

const DownloadButton = (props) => {
  const i18n = useI18n()

  const {
    disabled,
    href,
    id,
    label = i18n.t('common.download'),
    onClick,
    requestMethod,
    requestParams,
    showLabel,
    title,
    className,
  } = props

  return (
    <button
      type="button"
      className={`btn btn-s ${className}`}
      aria-disabled={disabled}
      data-testid={id}
      title={title}
      onClick={async () => {
        if (href) {
          const response = await axios({
            url: href,
            method: requestMethod,
            responseType: 'blob',
            data: requestMethod !== 'GET' ? requestParams : null,
            params: requestMethod === 'GET' ? requestParams : null,
          })
          const blob = new Blob([response.data])
          const contentDisposition = R.path(['headers', 'content-disposition'], response)
          const fileName = contentDisposition.slice('attachment; filename='.length)
          FileSaver.saveAs(blob, fileName)
        }
        if (onClick) {
          await onClick()
        }
      }}
    >
      <span className={`icon icon-download2 icon-14px${showLabel && label ? ' icon-left' : ''}`} />
      {showLabel && i18n.t(label)}
    </button>
  )
}

DownloadButton.propTypes = {
  className: PropTypes.string,
  disabled: PropTypes.bool,
  id: PropTypes.string,
  href: PropTypes.string, // specify href, onClick or both
  label: PropTypes.string,
  onClick: PropTypes.func, // specify href, onClick or both
  requestMethod: PropTypes.oneOf(['GET', 'POST']),
  requestParams: PropTypes.object,
  showLabel: PropTypes.bool,
  title: PropTypes.string,
}

DownloadButton.defaultProps = {
  className: '',
  disabled: false,
  href: null,
  id: null,
  label: undefined, // default to i18n.t('common.download')
  onClick: null,
  requestMethod: 'GET',
  requestParams: null,
  showLabel: true,
  title: null,
}

export default DownloadButton
