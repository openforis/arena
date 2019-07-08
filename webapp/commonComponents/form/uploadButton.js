import './uploadButton.scss'

import React, { useRef } from 'react'
import * as R from 'ramda'
import useI18n from '../useI18n'

const checkFilesSize = (files, maxSizeMB) =>
  R.find(file => file.size > maxSizeMB * 1024 * 1024, files)
    ? alert(`File exceeds maximum size (${maxSizeMB}MB)`)
    : true

const UploadButton = props => {
  const i18n = useI18n()

  const {
    label = i18n.t('common.upload'),
    disabled, showLabel, maxSize, accept,
    onChange,
  } = props

  const fileInput = useRef(null)

  return (
    <React.Fragment>

      <input
        ref={fileInput}
        type="file"
        style={{ display: 'none' }}
        accept={accept}
        onChange={() => {
          const files = fileInput.current.files
          if (checkFilesSize(files, maxSize)) {
            onChange(files)
          }
        }}/>

      <button
        className="btn btn-s"
        aria-disabled={disabled}
        onClick={() => {
          // first reset current value, then trigger click event
          fileInput.current.value = ''
          fileInput.current.dispatchEvent(new MouseEvent('click'))
        }}>
        <span className={`icon icon-upload2 icon-14px${showLabel ? ' icon-left' : ''}`}/>
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
  maxSize: 10, //mega bytes
  accept: null //e.g. .txt, .xls (null = all type of files are accepted)
}

export default UploadButton