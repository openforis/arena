import './RecordsDataExportModal.scss'

import React from 'react'
import PropTypes from 'prop-types'

import { Modal, ModalBody } from '@webapp/components/modal'

import DataExport from '../../DataExport'

export const RecordsDataExportModal = (props) => {
  const { onClose, recordUuids, search } = props

  return (
    <Modal className="records-data-export" onClose={onClose} showCloseButton title="dataView.dataExport.title">
      <ModalBody>
        <DataExport search={search} recordUuids={recordUuids} sourceSelectionAvailable />
      </ModalBody>
    </Modal>
  )
}

RecordsDataExportModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  recordUuids: PropTypes.array,
  search: PropTypes.string,
}
