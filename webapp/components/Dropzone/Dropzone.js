import './Dropzone.scss'

import React, { useState } from 'react'
import PropTypes from 'prop-types'
import ReactDropzone from 'react-dropzone'
import classNames from 'classnames'

import { useI18n } from '@webapp/store/system'
import { FileUtils } from '@webapp/utils/fileUtils'

const Dropzone = (props) => {
  const { accept, disabled, maxSize, multiple, onDrop: onDropProp } = props

  const i18n = useI18n()
  const [files, setFiles] = useState([])

  const acceptedExtensions = Object.values(accept)
    .flat()
    .join(` ${i18n.t('common.and')} `)

  const onDrop = (acceptedFiles) => {
    setFiles(acceptedFiles)
    onDropProp(acceptedFiles)
  }

  return (
    <ReactDropzone accept={accept} disabled={disabled} maxSize={maxSize} multiple={multiple} onDrop={onDrop}>
      {({ getRootProps, getInputProps }) => (
        <div className={classNames('dropzone', { disabled })} {...getRootProps()}>
          <input {...getInputProps()} />
          <p>{i18n.t('dropzone.message')}</p>
          <em>{i18n.t('dropzone.acceptedFilesMessage', { acceptedExtensions })}</em>
          {files.length > 0 && (
            <aside>
              <h5>{i18n.t('common.file', { count: files.length })}</h5>
              <ul>
                {files.map((file) => (
                  <li key={file.name}>
                    {file.name} - {FileUtils.humanReadableFileSize(file.size)}
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </div>
      )}
    </ReactDropzone>
  )
}

Dropzone.propTypes = {
  accept: PropTypes.object,
  disabled: PropTypes.bool,
  maxSize: PropTypes.number,
  multiple: PropTypes.bool,
  onDrop: PropTypes.func.isRequired,
}

Dropzone.defaultProps = {
  accept: {},
  disabled: false,
  maxSize: 50 * 1024 * 1024, // 50MB
  multiple: false,
}

export default Dropzone
