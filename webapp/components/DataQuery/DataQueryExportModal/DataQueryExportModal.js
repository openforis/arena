import './DataQueryExportModal.scss'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'

import { Objects } from '@openforis/arena-core'

import { Query } from '@common/model/query'

import * as API from '@webapp/service/api'

import { DataExplorerSelectors } from '@webapp/store/dataExplorer'
import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'

import { Modal, ModalBody } from '@webapp/components/modal'
import { ButtonDownload } from '@webapp/components/buttons'

import { DataExportOptionsPanel } from '@webapp/views/App/views/Data/DataExport/DataExportOptionsPanel'
import {
  dataExportOptions,
  defaultDataExportOptionsSelection,
} from '@webapp/views/App/views/Data/DataExport/dataExportOptions'

export const DataQueryExportModal = (props) => {
  const { onClose } = props

  const surveyId = useSurveyId()
  const cycle = useSurveyCycleKey()
  const query = DataExplorerSelectors.useQuery()
  const [state, setState] = useState({
    selectedOptionsByKey: defaultDataExportOptionsSelection,
  })
  const entityDefUuid = Query.getEntityDefUuid(query)
  const isAggregateMode = Query.isModeAggregate(query)
  const { selectedOptionsByKey } = state
  const availableOptions = useMemo(
    () =>
      isAggregateMode ? [] : [dataExportOptions.includeCategoryItemsLabels, dataExportOptions.expandCategoryItems],
    [isAggregateMode]
  )

  const onExportClick = useCallback(async () => {
    const tempFileName = await API.exportDataQueryToTempFile({ surveyId, cycle, query, options: selectedOptionsByKey })
    API.downloadDataQueryExport({ surveyId, cycle, entityDefUuid, tempFileName })
    onClose()
  }, [cycle, entityDefUuid, onClose, query, selectedOptionsByKey, surveyId])

  const onOptionChange = (option) => (value) =>
    setState((statePrev) => {
      const optionsUpdated = { ...statePrev.selectedOptionsByKey, [option]: value }
      return { ...statePrev, selectedOptionsByKey: optionsUpdated }
    })

  useEffect(() => {
    if (isAggregateMode) {
      // no available export options, export directly
      onExportClick()
    }
  }, [isAggregateMode, onExportClick])

  if (Objects.isEmpty(availableOptions)) return null

  return (
    <Modal className="data-query-export-modal" onClose={onClose} showCloseButton title="dataView.dataExport.title">
      <ModalBody>
        <DataExportOptionsPanel
          availableOptions={availableOptions}
          onOptionChange={onOptionChange}
          selectedOptionsByKey={selectedOptionsByKey}
        />
        <ButtonDownload className="btn-primary" label="common.csvExport" onClick={onExportClick} />
      </ModalBody>
    </Modal>
  )
}

DataQueryExportModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  recordUuids: PropTypes.array,
  search: PropTypes.string,
}
