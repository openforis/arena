import './uploadButton.scss'

import React, {useRef} from 'react'
import * as R from 'ramda'
import {useI18n} from '../hooks'

const checkFilesSize = (files, maxSizeMB) =>
  R.find(file => file.size > maxSizeMB * 1024 * 1024, files)
    ? alert(`File exceeds maximum size (${maxSizeMB}MB)`)
    : true

const UploadButton = props => {
  const i18n = useI18n()

  const {
    label = i18n.t('common.upload'),
    disabled,
    showLabel,
    showIcon,
    maxSize,
    accept,
    onChange,
    className,
  } = props

  const fileInput = useRef(null)

  return (
    <React.Fragment>
      <input
        ref={fileInput}
        type="file"
        style={{display: 'none'}}
        accept={accept}
        onChange={() => {
          const files = fileInput.current.files
          if (checkFilesSize(files, maxSize)) {
            onChange(files)
          }
        }}
      />

      <button
        className={className || 'btn btn-s'}
        aria-disabled={disabled}
        onClick={() => {
          // First reset current value, then trigger click event
          fileInput.current.value = ''
          fileInput.current.dispatchEvent(new MouseEvent('click'))
        }}
      >
        {showIcon && (
          <span
            className={`icon icon-upload2 icon-14px${
              showLabel ? ' icon-left' : ''
            }`}
          />
        )}
        {showLabel && label}
      </button>
    </React.Fragment>
  )
}

UploadButton.defaultProps = {
  disabled: false,
  label: null,
  onChange: null,
  showLabel: true,
  showIcon: true,
  maxSize: 10, // Mega bytes
  accept: null, // E.g. .txt, .xls (null = all type of files are accepted)
  className: null, // Custom css class
}

export default UploadButton
