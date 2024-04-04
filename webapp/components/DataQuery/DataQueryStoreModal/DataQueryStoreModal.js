import React from 'react'

import { DataQuerySummaries } from '@openforis/arena-server'

import { Modal, ModalBody } from '@webapp/components/modal'
import Table from '@webapp/components/Table'
import { useSurveyPreferredLang } from '@webapp/store/survey'

export const DataQueryStoreModal = (props) => {
  const { onClose } = props
  const lang = useSurveyPreferredLang()

  const columns = [
    { key: 'position', header: '#', renderItem: ({ itemPosition }) => itemPosition, width: '50px' },
    {
      key: 'name',
      header: 'common.name',
      renderItem: ({ item }) => DataQuerySummaries.getName(item),
      width: '1fr',
    },
    {
      key: 'label',
      header: 'common.label',
      renderItem: ({ item }) => DataQuerySummaries.getLabel(lang)(item),
      width: '1fr',
    },
  ]

  return (
    <Modal
      className="category__import-summary"
      onClose={onClose}
      showCloseButton
      title="categoryEdit.importSummary.title"
    >
      <ModalBody>
        <Table module="data_queries" columns={columns} />
      </ModalBody>
    </Modal>
  )
}
