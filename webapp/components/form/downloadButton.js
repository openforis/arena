import React from 'react'
import PropTypes from 'prop-types'
import axios from 'axios'
import * as R from 'ramda'
import * as FileSaver from 'file-saver'

import { useI18n } from '@webapp/store/system'

const DownloadButton = (props) => {
  const i18n = useI18n()

  const {
    href,
    requestMethod,
    requestParams,
    label = i18n.t('common.download'),
    title,
    className,
    showLabel,
    disabled,
    id,
  } = props

  return (
    <button
      type="button"
      className={`btn btn-s ${className}`}
      aria-disabled={disabled}
      data-testid={id}
      title={title}
      onClick={async () => {
        const response = await axios({
          url: href,
          method: requestMethod,
          responseType: 'blob',
          data: requestParams,
        })
        const blob = new Blob([response.data])
        const contentDisposition = R.path(['headers', 'content-disposition'], response)
        const fileName = contentDisposition.slice('attachment; filename='.length)
        FileSaver.saveAs(blob, fileName)
      }}
    >
      <span className={`icon icon-download2 icon-14px${showLabel && label ? ' icon-left' : ''}`} />
      {showLabel && label}
    </button>
  )
}

DownloadButton.propTypes = {
  className: PropTypes.string,
  disabled: PropTypes.bool,
  id: PropTypes.string,
  href: PropTypes.string.isRequired,
  label: PropTypes.string,
  requestMethod: PropTypes.oneOf(['GET', 'POST']),
  requestParams: PropTypes.object,
  showLabel: PropTypes.bool,
  title: PropTypes.string,
}

DownloadButton.defaultProps = {
  className: '',
  disabled: false,
  id: null,
  label: null,
  requestMethod: 'GET',
  requestParams: null,
  showLabel: true,
  title: null,
}

export default DownloadButton
