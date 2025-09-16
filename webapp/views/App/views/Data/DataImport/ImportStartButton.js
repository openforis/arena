import './ImportStartButton.scss'

import React, { useCallback, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { Button, ProgressBar } from '@webapp/components'
import { DialogConfirmActions } from '@webapp/store/ui'
import { ButtonIconCancel } from '@webapp/components/buttons'
import { useConfirmAsync } from '@webapp/components/hooks'

const stata = {
  running: 'running',
  stopped: 'stopped',
  paused: 'paused',
}

const initialState = {
  uploadProgressPercent: -1,
  processedChunks: -1,
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
    testId = null,
  } = props

  const dispatch = useDispatch()
  const uploadingRef = useRef(false)
  const processorRef = useRef(null)
  const confirm = useConfirmAsync()
  const [state, setState] = useState(initialState)

  const { status, uploadProgressPercent } = state

  const reset = useCallback(() => {
    uploadingRef.current = false
    processorRef.current?.stop()
    setState(initialState)
  }, [])

  const onUploadProgress = useCallback((progressEvent) => {
    if (uploadingRef.current) {
      const { loaded: processedChunks, total } = progressEvent
      const percent = Math.round((processedChunks / total) * 100)
      setState((statePrev) => ({ ...statePrev, uploadProgressPercent: percent }))
    }
  }, [])

  const onStartConfirmed = useCallback(async () => {
    uploadingRef.current = true
    setState((statePrev) => ({ ...statePrev, status: stata.running, uploadProgressPercent: 0 }))

    // when retrying, re-start from current chunk
    const processorCurrentChunkNumber = processorRef.current?.currentChunkNumber
    const startFromChunk = processorCurrentChunkNumber > 0 ? processorCurrentChunkNumber : 1

    const startRes = startFunction({
      ...startFunctionParams,
      onUploadProgress,
      startFromChunk,
    })
    const promise = startRes.promise ?? startRes
    processorRef.current = startRes.processor
    try {
      const result = await promise
      onUploadComplete(result)
      reset()
    } catch (error) {
      if (await confirm({ key: 'common.uploadErrorConfirm.message', params: { error } })) {
        await onStartConfirmed()
      } else {
        reset()
      }
    }
  }, [confirm, onUploadComplete, onUploadProgress, reset, startFunction, startFunctionParams])

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
      {uploadProgressPercent >= 0 ? (
        <div className="import-start-btn-progress-container">
          <ProgressBar indeterminate={false} progress={uploadProgressPercent} textKey={'common.uploadingFile'} />
          {processorRef.current && (
            <>
              {status === stata.running ? (
                <Button
                  iconClassName="icon-pause icon-12px"
                  label="common.pause"
                  onClick={onUploadPauseClick}
                  showLabel={false}
                  variant="text"
                />
              ) : (
                <Button
                  iconClassName="icon-play3 icon-12px"
                  label="common.resume"
                  onClick={onUploadResumeClick}
                  showLabel={false}
                  variant="text"
                />
              )}
              <ButtonIconCancel onClick={onUploadCancelClick} />
            </>
          )}
        </div>
      ) : (
        <Button
          className={className}
          disabled={disabled || uploadProgressPercent >= 0}
          label={label}
          onClick={onStartClick}
          testId={testId}
        />
      )}
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
  testId: PropTypes.string,
}
