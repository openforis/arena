import React, { useCallback, useMemo, useState } from 'react'
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
import { Checkbox } from '@webapp/components/form'
import ExpressionEditorPopup from '@webapp/components/expression/expressionEditorPopup'
import * as ExpressionParser from '@webapp/components/expression/expressionParser'
import { NodeDefTreeSelect } from '@webapp/components/survey/NodeDefsSelector'
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

export const HeaderLeft = ({
  allAttributeDefUuids = [],
  onQueryChange,
  onSelectedAttributeDefUuidsChange,
  query,
  restParams = {},
  selectedAttributeDefUuids = [],
}) => {
  const dispatch = useDispatch()
  const survey = useSurvey()
  const surveyId = useSurveyId()
  const cycle = useSurveyCycleKey()
  const surveyName = useSurveyName()
  const [filterEditorShown, setFilterEditorShown] = useState(false)
  const [attributeFilterShown, setAttributeFilterShown] = useState(false)

  const rootNodeDef = Survey.getNodeDefRoot(survey)
  const rootNodeDefUuid = NodeDef.getUuid(rootNodeDef)
  const filter = query ? Query.getFilter(query) : null

  const selectedAttributeDefUuidsSet = useMemo(() => new Set(selectedAttributeDefUuids), [selectedAttributeDefUuids])

  const descendantAttributeDefUuidsByNodeDefUuid = useMemo(() => {
    if (!rootNodeDef) return {}

    const map = {}
    const visit = (nodeDef) => {
      const nodeDefUuid = NodeDef.getUuid(nodeDef)
      const children = Survey.getNodeDefChildrenSorted({ nodeDef, cycle })(survey)
      const attributeDefUuids = NodeDef.isAttribute(nodeDef) && !NodeDef.isAnalysis(nodeDef) ? [nodeDefUuid] : []

      children.forEach((childDef) => {
        attributeDefUuids.push(...visit(childDef))
      })

      map[nodeDefUuid] = [...new Set(attributeDefUuids)]
      return map[nodeDefUuid]
    }

    visit(rootNodeDef)
    return map
  }, [cycle, rootNodeDef, survey])

  const allAttributesSelected = useMemo(() => {
    if (allAttributeDefUuids.length === 0) return true
    if (selectedAttributeDefUuids.length !== allAttributeDefUuids.length) return false
    return allAttributeDefUuids.every((attributeDefUuid) => selectedAttributeDefUuidsSet.has(attributeDefUuid))
  }, [allAttributeDefUuids, selectedAttributeDefUuids.length, selectedAttributeDefUuidsSet])

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

  const onAttributeSelectionChange = useCallback(
    (attributeDefUuids, selected) => {
      if (!attributeDefUuids?.length) return
      const next = new Set(selectedAttributeDefUuids)
      attributeDefUuids.forEach((attributeDefUuid) => {
        if (selected) {
          next.add(attributeDefUuid)
        } else {
          next.delete(attributeDefUuid)
        }
      })
      onSelectedAttributeDefUuidsChange([...next])
    },
    [onSelectedAttributeDefUuidsChange, selectedAttributeDefUuids]
  )

  const getSelectionStatusByNodeDefUuid = useCallback(
    (nodeDefUuid) => {
      const descendantAttributeDefUuids = descendantAttributeDefUuidsByNodeDefUuid[nodeDefUuid] ?? []
      if (!descendantAttributeDefUuids.length) return { checked: false, indeterminate: false, selectable: false }

      const selectedCount = descendantAttributeDefUuids.filter((uuid) => selectedAttributeDefUuidsSet.has(uuid)).length
      return {
        checked: selectedCount === descendantAttributeDefUuids.length,
        indeterminate: selectedCount > 0 && selectedCount < descendantAttributeDefUuids.length,
        selectable: true,
      }
    },
    [descendantAttributeDefUuidsByNodeDefUuid, selectedAttributeDefUuidsSet]
  )

  return (
    <div className="validation-report__header-left">
      <ButtonIconFilter
        className={`btn btn-edit${filter ? ' highlight' : ''}`}
        onClick={() => setFilterEditorShown(true)}
        label="dataView:filterRecords.buttonTitle"
        title={filter ? Expression.toString(filter, Expression.modes.sql) : undefined}
        variant="outlined"
      />
      <ButtonIconFilter
        className={`btn btn-edit${!allAttributesSelected ? ' highlight' : ''}`}
        iconClassName="icon icon-12px icon-tree"
        onClick={() => setAttributeFilterShown((shown) => !shown)}
        label="common.attribute_other"
        variant="outlined"
      />
      <ButtonDownload className="btn-csv-export" onClick={onExportButtonClick} label="common.exportToExcel" />

      {attributeFilterShown && (
        <div className="validation-report__attributes-filter-panel">
          <Checkbox
            checked={allAttributesSelected}
            className="select-all"
            indeterminate={!allAttributesSelected && selectedAttributeDefUuids.length > 0}
            label="common.selectAll"
            onChange={(selected) => onSelectedAttributeDefUuidsChange(selected ? allAttributeDefUuids : [])}
          />
          <NodeDefTreeSelect
            disableSelection
            includeMultipleAttributes
            includeSingleAttributes
            includeSingleEntities
            isNodeDefIncluded={(nodeDef) =>
              NodeDef.isEntity(nodeDef) || (NodeDef.isAttribute(nodeDef) && !NodeDef.isAnalysis(nodeDef))
            }
            onSelect={() => null}
            renderItemPrefix={(item) => {
              const { checked, indeterminate, selectable } = getSelectionStatusByNodeDefUuid(item.key)
              if (!selectable) return null
              return (
                <Checkbox
                  checked={checked}
                  indeterminate={indeterminate}
                  onChange={(selected) =>
                    onAttributeSelectionChange(descendantAttributeDefUuidsByNodeDefUuid[item.key] ?? [], selected)
                  }
                />
              )
            }}
          />
        </div>
      )}

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
    </div>
  )
}

HeaderLeft.propTypes = {
  allAttributeDefUuids: PropTypes.array,
  onQueryChange: PropTypes.func.isRequired,
  onSelectedAttributeDefUuidsChange: PropTypes.func.isRequired,
  query: PropTypes.object,
  restParams: PropTypes.object,
  selectedAttributeDefUuids: PropTypes.array,
}
