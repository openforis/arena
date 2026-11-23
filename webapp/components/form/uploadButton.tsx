import './uploadButton.scss'

import { useRef } from 'react'

import { Button } from '../buttons/Button'

const checkFilesSize = (files: FileList, maxSizeMB: number) =>
  Array.from(files).some((file) => file.size > maxSizeMB * 1024 * 1024)
    ? alert(`File exceeds maximum size (${maxSizeMB}MB)`)
    : true

type UploadButtonProps = {
  accept?: string
  className?: string
  disabled?: boolean
  inputFieldId?: string
  label?: string
  maxSize?: number
  onChange?: (...args: any[]) => any
  showIcon?: boolean
  showLabel?: boolean
  title?: string
  variant?: 'contained' | 'outlined' | 'text'
}

const UploadButton = (props: UploadButtonProps) => {
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
    title = null,
    variant = 'contained',
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
        title={title}
        variant={variant}
      />
    </>
  )
}

export default UploadButton
