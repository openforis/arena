import './RecordsDataExportModal.scss'

import React from 'react'
import PropTypes from 'prop-types'

import { Modal, ModalBody } from '@webapp/components/modal'
import ExportData from '../../ExportData'

export const RecordsDataExportModal = (props) => {
  const { onClose, recordUuids } = props

  return (
    <Modal className="records-data-export" onClose={onClose} showCloseButton title="dataView.dataExport.title">
      <ModalBody>
        <ExportData sourceSelectionAvailable recordUuids={recordUuids} />
      </ModalBody>
    </Modal>
  )
}

RecordsDataExportModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  recordUuids: PropTypes.array,
}
