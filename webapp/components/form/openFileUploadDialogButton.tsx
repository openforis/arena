import './uploadButton.scss'

import { useCallback } from 'react'

import { useI18n } from '@webapp/store/system'
import { useAppDispatch } from '@webapp/store'
import { FileUploadDialogActions } from '@webapp/store/ui'

import { Button } from '../buttons'

type OpenFileUploadDialogButtonProps = {
  accept?: string | Record<string, any>
  className?: string
  disabled?: boolean
  label?: string
  maxSize?: number
  onOk: (...args: any[]) => any
  showIcon?: boolean
  showLabel?: boolean
  variant?: 'contained' | 'outlined' | 'text'
}

const OpenFileUploadDialogButton = (props: OpenFileUploadDialogButtonProps) => {
  const {
    accept = null, // E.g. .txt, .xls (null = all type of files are accepted)
    className = 'btn', // Custom css class
    disabled = false,
    label: labelProp = 'common.upload',
    maxSize = 10, // Mega bytes
    onOk,
    showLabel = true,
    showIcon = true,
    variant,
  } = props

  const dispatch = useAppDispatch()
  const i18n = useI18n()

  const label = i18n.t(labelProp)

  const onClick = useCallback(() => {
    dispatch(FileUploadDialogActions.open({ accept, maxSize, onOk, title: label }))
  }, [accept, dispatch, label, maxSize, onOk])

  return (
    <Button
      className={className}
      disabled={disabled}
      onClick={onClick}
      iconClassName={showIcon ? 'icon-upload2' : null}
      label={showLabel ? label : null}
      variant={variant}
    />
  )
}

export default OpenFileUploadDialogButton
