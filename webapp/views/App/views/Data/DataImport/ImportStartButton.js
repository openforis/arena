import React, { useCallback, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { Button, ProgressBar } from '@webapp/components'
import { DialogConfirmActions } from '@webapp/store/ui'
import { ButtonIconCancel } from '@webapp/components/buttons'

export const ImportStartButton = (props) => {
  const {
    className = 'btn-primary start-btn',
    confirmMessageKey,
    confirmMessageParams,
    disabled = false,
    label = 'dataImportView.startImport',
    onUploadComplete,
    showConfirm = false,
    startFunction,
    startFunctionParams = {},
    strongConfirm = false,
    strongConfirmRequiredText = null,
  } = props

  const dispatch = useDispatch()
  const cancelRef = useRef(null)
  const uploadingRef = useRef(false)
  const [uploadProgressPercent, setUploadProgressPercent] = useState(-1)

  const onUploadProgress = useCallback((progressEvent) => {
    if (uploadingRef.current) {
      const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100)
      setUploadProgressPercent(percent)
    }
  }, [])

  const onStartConfirmed = useCallback(async () => {
    uploadingRef.current = true
    setUploadProgressPercent(0)

    const startRes = startFunction({ ...startFunctionParams, onUploadProgress })
    const promise = startRes instanceof Promise ? startRes : startRes.promise
    cancelRef.current = startRes.cancel
    const result = await promise

    uploadingRef.current = false
    setUploadProgressPercent(-1)
    onUploadComplete(result)
  }, [onUploadComplete, onUploadProgress, startFunction, startFunctionParams])

  const onStartClick = useCallback(async () => {
    if (showConfirm) {
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: confirmMessageKey,
          params: confirmMessageParams,
          onOk: onStartConfirmed,
          strongConfirm,
          strongConfirmRequiredText,
        })
      )
    } else {
      await onStartConfirmed()
    }
  }, [
    confirmMessageKey,
    confirmMessageParams,
    dispatch,
    onStartConfirmed,
    showConfirm,
    strongConfirm,
    strongConfirmRequiredText,
  ])

  const onUploadCancelClick = useCallback(() => {
    cancelRef.current?.()
    uploadingRef.current = false
    setUploadProgressPercent(-1)
  }, [])

  return (
    <>
      {uploadProgressPercent >= 0 && (
        <div className="container">
          <ProgressBar indeterminate={false} progress={uploadProgressPercent} />
          {cancelRef.current && <ButtonIconCancel onClick={onUploadCancelClick} />}
        </div>
      )}
      <Button
        className={className}
        disabled={disabled || uploadProgressPercent >= 0}
        label={label}
        onClick={onStartClick}
      />
    </>
  )
}

ImportStartButton.propTypes = {
  className: PropTypes.string,
  confirmMessageKey: PropTypes.string,
  confirmMessageParams: PropTypes.object,
  disabled: PropTypes.bool,
  label: PropTypes.string,
  onUploadComplete: PropTypes.func.isRequired,
  showConfirm: PropTypes.bool,
  startFunction: PropTypes.func.isRequired,
  startFunctionParams: PropTypes.object,
  strongConfirm: PropTypes.bool,
  strongConfirmRequiredText: PropTypes.string,
}
