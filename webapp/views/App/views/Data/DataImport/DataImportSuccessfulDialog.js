import React from 'react'

import { Button } from '@webapp/components'
import { Modal, ModalBody, ModalFooter } from '@webapp/components/modal'
import { useI18n } from '@webapp/store/system'
import Markdown from '@webapp/components/markdown'

export const DataImportCompleteDialog = (props) => {
  const { importCompleteResult, onClose } = props

  const i18n = useI18n()

  const content = i18n.t('dataImportView.importComplete', importCompleteResult)

  return (
    <Modal className="data-import_complete-dialog" onClose={onClose}>
      <ModalBody>
        <Markdown source={content} />
      </ModalBody>
      <ModalFooter>
        <Button className="btn modal-footer__item" onClick={onClose} label="common.ok" />
      </ModalFooter>
    </Modal>
  )
}
