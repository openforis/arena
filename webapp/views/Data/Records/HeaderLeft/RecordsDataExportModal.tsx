import './RecordsDataExportModal.scss'

import { Modal, ModalBody } from '@webapp/components/Modal'
import DataExport from '../../DataExport'

type RecordsDataExportModalProps = {
  onClose: (...args: any[]) => any
  recordUuids?: any[]
  search?: string
}

export const RecordsDataExportModal = (props: RecordsDataExportModalProps) => {
  const { onClose, recordUuids, search } = props

  return (
    <Modal className="records-data-export" onClose={onClose} showCloseButton title="dataView:dataExport.title">
      <ModalBody>
        <DataExport search={search} recordUuids={recordUuids} sourceSelectionAvailable />
      </ModalBody>
    </Modal>
  )
}
