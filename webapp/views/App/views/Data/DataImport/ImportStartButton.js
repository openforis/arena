import React, { useCallback, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { Button, ProgressBar } from '@webapp/components'
import { DialogConfirmActions } from '@webapp/store/ui'
import { ButtonIconCancel } from '@webapp/components/buttons'

const stata = {
  running: 'running',
  stopped: 'stopped',
  paused: 'paused',
}

const initialState = {
  uploadProgressPercent: -1,
  status: stata.stopped,
}

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
  const uploadingRef = useRef(false)
  const processorRef = useRef(null)
  const [state, setState] = useState(initialState)

  const { status, uploadProgressPercent } = state

  const reset = useCallback(() => {
    uploadingRef.current = false
    processorRef.current?.stop()
    setState(initialState)
  }, [])

  const onUploadProgress = useCallback((progressEvent) => {
    if (uploadingRef.current) {
      const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100)
      setState((statePrev) => ({ ...statePrev, uploadProgressPercent: percent }))
    }
  }, [])

  const onStartConfirmed = useCallback(async () => {
    uploadingRef.current = true
    setState((statePrev) => ({ ...statePrev, status: stata.running, uploadProgressPercent: 0 }))

    const startRes = startFunction({ ...startFunctionParams, onUploadProgress })
    const promise = startRes.promise ?? startRes
    processorRef.current = startRes.processor
    const result = await promise
    onUploadComplete(result)
    reset()
  }, [onUploadComplete, onUploadProgress, reset, startFunction, startFunctionParams])

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
    reset()
  }, [reset])

  const onUploadPauseClick = useCallback(() => {
    uploadingRef.current = false
    setState((statePrev) => ({ ...statePrev, status: stata.paused }))
    processorRef.current?.pause()
  }, [])

  const onUploadResumeClick = useCallback(() => {
    uploadingRef.current = true
    setState((statePrev) => ({ ...statePrev, status: stata.running }))
    processorRef.current?.resume()
  }, [])

  return (
    <>
      {uploadProgressPercent >= 0 && (
        <div className="container">
          <ProgressBar indeterminate={false} progress={uploadProgressPercent} />
          {processorRef.current && (
            <>
              {status === stata.running ? (
                <Button
                  iconClassName="icon-pause icon-12px"
                  onClick={onUploadPauseClick}
                  showLabel={false}
                  variant="text"
                />
              ) : (
                <Button
                  iconClassName="icon-play icon-12px"
                  onClick={onUploadResumeClick}
                  showLabel={false}
                  variant="text"
                />
              )}
              <ButtonIconCancel onClick={onUploadCancelClick} />
            </>
          )}
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
