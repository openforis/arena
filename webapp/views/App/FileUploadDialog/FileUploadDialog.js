import './FileUploadDialog.scss'

import React, { useCallback, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'

import { Button, Dropzone, Modal, ModalBody, ModalFooter, ProgressBar } from '@webapp/components'

import { FileUploadDialogActions, useFileUploadDialog } from '@webapp/store/ui'

const initialState = { files: [] }

export const FileUploadDialog = () => {
  const dispatch = useDispatch()

  const { accept, maxSize, open, onOk, title } = useFileUploadDialog()

  const [state, setState] = useState(initialState)

  const { files, uploadProgressPercent, uploading } = state

  useEffect(() => {
    if (!open) {
      setState(initialState)
    }
  }, [open])

  const onFilesDrop = useCallback((files) => {
    setState((statePrev) => ({ ...statePrev, files }))
  }, [])

  const onClose = useCallback(() => {
    dispatch(FileUploadDialogActions.close())
  }, [dispatch])

  const onUploadProgress = useCallback((progressEvent) => {
    const uploadProgressPercent = Math.round((progressEvent.loaded / progressEvent.total) * 100)
    setState((statePrev) => ({ ...statePrev, uploadProgressPercent, uploading: uploadProgressPercent < 100 }))
  }, [])

  const onOkClick = useCallback(async () => {
    await onOk({ files, onUploadProgress })
  }, [files, onOk, onUploadProgress])

  if (!open) return null

  return (
    <Modal className="file-upload-dialog" title={title} onClose={onClose} showCloseButton>
      <ModalBody>
        <Dropzone accept={accept} maxSize={maxSize} onDrop={onFilesDrop} droppedFiles={files} />
        {uploading && uploadProgressPercent >= 0 && (
          <ProgressBar indeterminate={false} progress={uploadProgressPercent} textKey="common.uploadingFile" />
        )}
      </ModalBody>
      <ModalFooter>
        <Button
          className="btn-primary modal-footer__item"
          disabled={files.length === 0 || uploading}
          onClick={onOkClick}
          label="common.ok"
        />
      </ModalFooter>
    </Modal>
  )
}
