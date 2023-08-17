import React, { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { Button, ProgressBar } from '@webapp/components'
import { DialogConfirmActions } from '@webapp/store/ui'

export const UploadStartButton = (props) => {
  const {
    confirmMessageKey,
    confirmMessageParams,
    disabled,
    showConfirm,
    startFunction,
    startFunctionParams,
    onUploadComplete,
  } = props

  const dispatch = useDispatch()
  const [uploadProgressPercent, setUploadProgressPercent] = useState(-1)

  const onUploadProgress = (progressEvent) => {
    const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100)
    setUploadProgressPercent(percent)
  }

  const onStartConfirmed = useCallback(async () => {
    const result = await startFunction({ ...startFunctionParams, onUploadProgress })
    setUploadProgressPercent(-1)
    onUploadComplete(result)
  }, [onUploadComplete, startFunction, startFunctionParams])

  const onStartClick = useCallback(async () => {
    if (showConfirm) {
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: confirmMessageKey,
          params: confirmMessageParams,
          onOk: onStartConfirmed,
        })
      )
    } else {
      await onStartConfirmed()
    }
  }, [confirmMessageKey, confirmMessageParams, dispatch, onStartConfirmed, showConfirm])

  return (
    <>
      {uploadProgressPercent >= 0 && <ProgressBar indeterminate={false} progress={uploadProgressPercent} />}
      <Button
        className="btn-primary"
        disabled={disabled || uploadProgressPercent >= 0}
        label="dataImportView.startImport"
        onClick={onStartClick}
      />
    </>
  )
}

UploadStartButton.propTypes = {
  confirmMessageKey: PropTypes.string,
  confirmMessageParams: PropTypes.object,
  disabled: PropTypes.bool,
  showConfirm: PropTypes.bool,
  startFunction: PropTypes.func.isRequired,
  startFunctionParams: PropTypes.object,
  onUploadComplete: PropTypes.func.isRequired,
}

UploadStartButton.defaultProps = {
  disabled: false,
  showConfirm: false,
  startFunctionParams: {},
}
