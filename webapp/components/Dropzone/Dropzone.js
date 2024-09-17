import './Dropzone.scss'

import React, { useCallback, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import ReactDropzone from 'react-dropzone'
import classNames from 'classnames'

import { Strings } from '@openforis/arena-core'

import { useI18n } from '@webapp/store/system'
import { FileUtils } from '@webapp/utils/fileUtils'
import { Alert } from '../Alert'

const Dropzone = (props) => {
  const {
    accept: acceptProp = {},
    disabled = false,
    droppedFiles = [],
    maxSize: maxSizeMB = 50, // 50MB
    multiple = false,
    onDrop: onDropProp,
  } = props

  const i18n = useI18n()
  const [errorMessage, setErrorMessage] = useState(null)

  const maxSize = maxSizeMB * 1000 * 1000

  const acceptPropObject = useMemo(
    () => (typeof acceptProp === 'string' ? { '': acceptProp } : acceptProp), // workaround to accept extensions containing special characters
    [acceptProp]
  )

  const acceptedExtensions = useMemo(
    () => Object.values(acceptPropObject).flat().map(Strings.removePrefix('.')),
    [acceptPropObject]
  )

  const acceptedExtensionsText = acceptedExtensions
    .map((extension) => `.${extension}`)
    .join(` ${i18n.t('common.and')} `)

  const acceptedExtensionsHaveInvalidCharacters = acceptedExtensions.some((extension) => /\W/.test(extension))

  const accept = acceptedExtensionsHaveInvalidCharacters ? undefined : acceptPropObject

  const validateFiles = useCallback(
    (files) => {
      const invalidExtension = files
        .map(FileUtils.getExtension)
        .find((extension) => !acceptedExtensions.includes(extension))

      if (invalidExtension) {
        return i18n.t('dropzone.error.invalidFileExtension', { extension: invalidExtension })
      }
      return null
    },
    [acceptedExtensions, i18n]
  )

  const onDropAccepted = useCallback(
    (files) => {
      const error = validateFiles(files)
      if (error) {
        setErrorMessage(error)
      } else {
        setErrorMessage(null)
        onDropProp(files)
      }
    },
    [onDropProp, validateFiles]
  )

  const onDropRejected = useCallback(
    (fileRejections) => {
      const errorMessages = fileRejections.map((fileRejection) => {
        const { errors, file } = fileRejection
        const errorCodes = errors.map((error) => error.code)

        if (errorCodes.includes('file-invalid-type')) {
          const extension = FileUtils.getExtension(file.path)
          return i18n.t('dropzone.error.invalidFileExtension', { extension })
        } else if (errorCodes.includes('file-too-large')) {
          return i18n.t('dropzone.error.fileTooBig')
        } else {
          return i18n.t('dropzone.error.fileNotValid')
        }
      })
      setErrorMessage(errorMessages.join(', '))
    },
    [i18n]
  )

  return (
    <>
      <ReactDropzone
        accept={accept}
        disabled={disabled}
        maxSize={maxSize}
        multiple={multiple}
        onDropAccepted={onDropAccepted}
        onDropRejected={onDropRejected}
      >
        {({ getRootProps, getInputProps }) => (
          <div className={classNames('dropzone', { disabled })} {...getRootProps()}>
            <input {...getInputProps()} />
            <p>{i18n.t('dropzone.message')}</p>
            {acceptedExtensions.length > 0 && (
              <em>
                {i18n.t('dropzone.acceptedFilesMessage', {
                  acceptedExtensions: acceptedExtensionsText,
                  maxSize: FileUtils.toHumanReadableFileSize(maxSize, { decimalPlaces: 0 }),
                })}
              </em>
            )}
            {droppedFiles?.length > 0 && (
              <aside>
                <h5>{i18n.t('dropzone.selectedFile', { count: droppedFiles.length })}</h5>
                <ul>
                  {droppedFiles.map((file) => (
                    <li key={file.name}>
                      {file.name} - {FileUtils.toHumanReadableFileSize(file.size)}
                    </li>
                  ))}
                </ul>
              </aside>
            )}
            {errorMessage && (
              <Alert autoDismiss onDismiss={() => setErrorMessage(null)} severity="error" text={errorMessage} />
            )}
          </div>
        )}
      </ReactDropzone>
    </>
  )
}

Dropzone.propTypes = {
  accept: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  disabled: PropTypes.bool,
  maxSize: PropTypes.number, // max file size in MB
  multiple: PropTypes.bool,
  onDrop: PropTypes.func.isRequired,
  droppedFiles: PropTypes.array,
}

export default Dropzone
