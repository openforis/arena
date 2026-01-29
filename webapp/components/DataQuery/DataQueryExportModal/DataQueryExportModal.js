import './DataQueryExportModal.scss'

import React, { useCallback, useMemo, useState } from 'react'
import PropTypes from 'prop-types'

import { Objects } from '@openforis/arena-core'

import { Query } from '@common/model/query'
import { FileFormats } from '@core/fileFormats'

import * as API from '@webapp/service/api'

import { DataExplorerSelectors } from '@webapp/store/dataExplorer'
import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'

import { useNotifyWarning } from '@webapp/components/hooks'
import { Modal, ModalBody } from '@webapp/components/modal'
import { ButtonDownload } from '@webapp/components/buttons'

import { DataExportOptionsPanel } from '@webapp/views/App/views/Data/DataExport/DataExportOptionsPanel'
import {
  dataExportOptions,
  defaultDataExportOptionsSelection,
} from '@webapp/views/App/views/Data/DataExport/dataExportOptions'

export const DataQueryExportModal = (props) => {
  const { onClose } = props

  const notifyWarning = useNotifyWarning()
  const surveyId = useSurveyId()
  const cycle = useSurveyCycleKey()
  const query = DataExplorerSelectors.useQuery()
  const [state, setState] = useState({
    selectedOptionsByKey: defaultDataExportOptionsSelection,
  })
  const entityDefUuid = Query.getEntityDefUuid(query)
  const isAggregateMode = Query.isModeAggregate(query)
  const { selectedOptionsByKey } = state
  const fileFormat = selectedOptionsByKey[dataExportOptions.fileFormat]

  const availableOptions = useMemo(() => {
    const _options = [dataExportOptions.includeCategoryItemsLabels]
    if (!isAggregateMode) {
      _options.push(dataExportOptions.expandCategoryItems)
    }
    return _options
  }, [isAggregateMode])

  const onExportClick = useCallback(async () => {
    try {
      const { downloadToken } = await API.exportDataQueryToTempFile({
        surveyId,
        cycle,
        query,
        options: selectedOptionsByKey,
      })
      API.downloadDataQueryExport({ surveyId, cycle, entityDefUuid, fileFormat, downloadToken })
    } catch (error) {
      const key =
        fileFormat === FileFormats.xlsx ? 'appErrors:dataExport.excelMaxCellsLimitExceeded' : 'dataExportView.error'
      notifyWarning({ key, params: { details: String(error) } })
    }
    onClose()
  }, [cycle, entityDefUuid, fileFormat, notifyWarning, onClose, query, selectedOptionsByKey, surveyId])

  const onOptionChange = (option) => (value) =>
    setState((statePrev) => {
      const optionsUpdated = { ...statePrev.selectedOptionsByKey, [option]: value }
      return { ...statePrev, selectedOptionsByKey: optionsUpdated }
    })

  if (Objects.isEmpty(availableOptions)) return null

  return (
    <Modal className="data-query-export-modal" onClose={onClose} showCloseButton title="dataView.dataExport.title">
      <ModalBody>
        <DataExportOptionsPanel
          availableOptions={availableOptions}
          onOptionChange={onOptionChange}
          selectedOptionsByKey={selectedOptionsByKey}
        />
        <ButtonDownload className="btn-primary" label="common.export" onClick={onExportClick} />
      </ModalBody>
    </Modal>
  )
}

DataQueryExportModal.propTypes = {
  onClose: PropTypes.func.isRequired,
}
