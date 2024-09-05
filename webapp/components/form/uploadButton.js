import './uploadButton.scss'

import React, { useRef } from 'react'
import PropTypes from 'prop-types'

import { Button } from '../buttons/Button'

const checkFilesSize = (files, maxSizeMB) =>
  Array.from(files).find((file) => file.size > maxSizeMB * 1024 * 1024)
    ? alert(`File exceeds maximum size (${maxSizeMB}MB)`)
    : true

const UploadButton = (props) => {
  const {
    accept = null, // E.g. .txt, .xls (null = all type of files are accepted)
    className = 'btn', // Custom css class
    disabled = false,
    inputFieldId = null,
    label = 'common.upload',
    maxSize = 10, // Mega bytes
    onChange = null,
    showLabel = true,
    showIcon = true,
  } = props

  const fileInput = useRef(null)

  return (
    <>
      <input
        id={inputFieldId}
        data-testid={inputFieldId}
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

      <Button
        type="button"
        className={className}
        disabled={disabled}
        iconClassName="icon-upload2 icon-14px"
        label={label}
        onClick={() => {
          // First reset current value, then trigger click event
          fileInput.current.value = ''
          fileInput.current.dispatchEvent(new MouseEvent('click'))
        }}
        showLabel={showLabel}
        showIcon={showIcon}
      />
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

export default UploadButton
