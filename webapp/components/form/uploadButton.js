import './uploadButton.scss'

import React, { useRef } from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useI18n } from '@webapp/store/system'

const checkFilesSize = (files, maxSizeMB) =>
  R.find((file) => file.size > maxSizeMB * 1024 * 1024, files)
    ? alert(`File exceeds maximum size (${maxSizeMB}MB)`)
    : true

const UploadButton = (props) => {
  const i18n = useI18n()

  const {
    inputFieldId,
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
    <>
      <input
        id={inputFieldId}
        ref={fileInput}
        type="file"
        style={{ display: 'none' }}
        accept={accept}
        onChange={() => {
          const { files } = fileInput.current
          if (checkFilesSize(files, maxSize)) {
            onChange(files)
          }
        }}
      />

      <button
        type="button"
        className={className || 'btn btn-s'}
        aria-disabled={disabled}
        onClick={() => {
          // First reset current value, then trigger click event
          fileInput.current.value = ''
          fileInput.current.dispatchEvent(new MouseEvent('click'))
        }}
      >
        {showIcon && <span className={`icon icon-upload2 icon-14px${showLabel ? ' icon-left' : ''}`} />}
        {showLabel && label}
      </button>
    </>
  )
}

UploadButton.propTypes = {
  accept: PropTypes.string,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  inputFieldId: PropTypes.string,
  label: PropTypes.string,
  maxSize: PropTypes.number,
  onChange: PropTypes.func,
  showIcon: PropTypes.bool,
  showLabel: PropTypes.bool,
}

UploadButton.defaultProps = {
  accept: null, // E.g. .txt, .xls (null = all type of files are accepted)
  className: null, // Custom css class
  disabled: false,
  inputFieldId: null,
  label: null,
  maxSize: 10, // Mega bytes
  onChange: null,
  showLabel: true,
  showIcon: true,
}

export default UploadButton
