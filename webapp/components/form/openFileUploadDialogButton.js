import './uploadButton.scss'

import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'
import { FileUploadDialogActions } from '@webapp/store/ui'

import { Button } from '../buttons'

const OpenFileUploadDialogButton = (props) => {
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

  const dispatch = useDispatch()
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

OpenFileUploadDialogButton.propTypes = {
  accept: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  className: PropTypes.string,
  disabled: PropTypes.bool,
  label: PropTypes.string,
  maxSize: PropTypes.number,
  onOk: PropTypes.func.isRequired,
  showIcon: PropTypes.bool,
  showLabel: PropTypes.bool,
  variant: PropTypes.string,
}

export default OpenFileUploadDialogButton
