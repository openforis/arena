import './FileUploadDialog.scss'

import React, { useCallback, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'

import { Button, Dropzone, Modal, ModalBody, ModalFooter } from '@webapp/components'

import { FileUploadDialogActions, useFileUploadDialog } from '@webapp/store/ui'

const initialState = { files: [] }

export const FileUploadDialog = () => {
  const dispatch = useDispatch()

  const { accept, maxSize, open, onOk, title } = useFileUploadDialog()

  const [state, setState] = useState(initialState)

  const { files } = state

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

  const onOkClick = useCallback(() => {
    onOk(files)
  }, [files, onOk])

  if (!open) return null

  return (
    <Modal className="file-upload-dialog" title={title} onClose={onClose} showCloseButton>
      <ModalBody>
        <Dropzone accept={accept} maxSize={maxSize} onDrop={onFilesDrop} droppedFiles={files} />
      </ModalBody>
      <ModalFooter>
        <Button
          className="btn-primary modal-footer__item"
          disabled={files.length === 0}
          onClick={onOkClick}
          label="common.ok"
        />
      </ModalFooter>
    </Modal>
  )
}
