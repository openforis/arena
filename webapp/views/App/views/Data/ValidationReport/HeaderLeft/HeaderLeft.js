import React, { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'
import axios from 'axios'
import PropTypes from 'prop-types'

import { ExportFileNameGenerator } from '@common/dataExport/exportFileNameGenerator'
import { Query } from '@common/model/query'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Expression from '@core/expressionParser/expression'
import { FileFormats } from '@core/fileFormats'

import * as DomUtils from '@webapp/utils/domUtils'
import { ButtonDownload } from '@webapp/components'
import { ButtonIconFilter } from '@webapp/components/buttons'
import ExpressionEditorPopup from '@webapp/components/expression/expressionEditorPopup'
import * as ExpressionParser from '@webapp/components/expression/expressionParser'
import * as API from '@webapp/service/api'
import { JobActions } from '@webapp/store/app'
import { useSurvey, useSurveyCycleKey, useSurveyId, useSurveyName } from '@webapp/store/survey'

const onExportComplete =
  ({ surveyId, surveyName, cycle }) =>
  async (job) => {
    const { tempFileName } = job.result

    const response = await axios.get(`/api/survey/${surveyId}/validationReport/download`, {
      params: { tempFileName },
      responseType: 'blob',
    })

    const outputFileName = ExportFileNameGenerator.generate({
      surveyName,
      cycle,
      fileType: 'ValidationReport',
      fileFormat: FileFormats.xlsx,
    })

    DomUtils.downloadBlobToFile(response.data, outputFileName)
  }

export const HeaderLeft = ({ onQueryChange, query, restParams = {} }) => {
  const dispatch = useDispatch()
  const survey = useSurvey()
  const surveyId = useSurveyId()
  const cycle = useSurveyCycleKey()
  const surveyName = useSurveyName()
  const [filterEditorShown, setFilterEditorShown] = useState(false)

  const rootNodeDef = Survey.getNodeDefRoot(survey)
  const rootNodeDefUuid = NodeDef.getUuid(rootNodeDef)
  const filter = query ? Query.getFilter(query) : null

  const onExportButtonClick = useCallback(async () => {
    const job = await API.startValidationReportGeneration({ surveyId, ...restParams })
    dispatch(
      JobActions.showJobMonitor({ autoHide: true, job, onComplete: onExportComplete({ surveyId, surveyName, cycle }) })
    )
  }, [cycle, dispatch, restParams, surveyId, surveyName])

  const onFilterChange = ({ expr } = {}) => {
    if (!expr) {
      onQueryChange(null)
      setFilterEditorShown(false)
      return
    }
    const exprNormalized = ExpressionParser.normalize({ expr, canBeCall: true })
    const queryUpdated = Query.assocFilter(exprNormalized)(query ?? Query.create({ entityDefUuid: rootNodeDefUuid }))
    onQueryChange(queryUpdated)
    setFilterEditorShown(false)
  }

  return (
    <>
      <ButtonIconFilter
        className={`btn btn-edit${filter ? ' highlight' : ''}`}
        onClick={() => setFilterEditorShown(true)}
        label="dataView:filterRecords.buttonTitle"
        title={filter ? Expression.toString(filter, Expression.modes.sql) : undefined}
        variant="outlined"
      />
      <ButtonDownload className="btn-csv-export" onClick={onExportButtonClick} label="common.exportToExcel" />
      {filterEditorShown && rootNodeDefUuid && (
        <ExpressionEditorPopup
          canBeCall
          nodeDefUuidContext={rootNodeDefUuid}
          nodeDefUuidCurrent={rootNodeDefUuid}
          includeAnalysis
          isContextParent={false}
          excludeCurrentNodeDef={false}
          query={filter ? Expression.toString(filter) : ''}
          mode={Expression.modes.sql}
          header="dataView:filterRecords.expressionEditorHeader"
          onChange={onFilterChange}
          onClose={() => setFilterEditorShown(false)}
        />
      )}
    </>
  )
}

HeaderLeft.propTypes = {
  onQueryChange: PropTypes.func.isRequired,
  query: PropTypes.object,
  restParams: PropTypes.object,
}
