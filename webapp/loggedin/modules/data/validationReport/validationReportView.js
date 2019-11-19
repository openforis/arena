import React from 'react'
import { connect } from 'react-redux'

import TableView from '@webapp/loggedin/tableViews/tableView'
import { useI18n, useOnUpdate } from '@webapp/commonComponents/hooks'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'

import { appModuleUri, dataModules } from '@webapp/loggedin/appModules'

import * as SurveyState from '@webapp/survey/surveyState'
import * as RecordsState from '@webapp/loggedin/modules/data/records/recordsState'

import { reloadListItems } from '@webapp/loggedin/tableViews/actions'

import * as ValidationUtils from '@webapp/utils/validationUtils'

const ValidationReportRowHeader = ({ nodeDefKeys }) => {
  const i18n = useI18n()

  return (
    <>
      <div>#</div>
      { nodeDefKeys.map((k, i) => <div key={i}>{NodeDef.getLabel(k, i18n.lang)}</div>) }
      <div>{i18n.t('common.path')}</div>
      {/* <div>{i18n.t('common.type')}</div> */}
      <div>{i18n.t('common.error')}</div>
    </>
  )
}

const ValidationReportRow = ({ survey, row, nodeDefKeys, idx, offset }) => {
  const i18n = useI18n()

  const path = row.keys_hierarchy.slice(1).reduce((path, h) => {
    const parentNodeDef = Survey.getNodeDefByUuid(h.nodeDefUuid)(survey)
    const parentNodeDefName = NodeDef.getLabel(parentNodeDef, i18n.lang)
    const keyValues = Object.values(h.keys).reduce((values, value) => values.concat(value === null ? 'null' : value), [])

    return path.concat(`${parentNodeDefName} (${keyValues.join(', ')})`)
  }, [])

  const lastNodeDef = Survey.getNodeDefByUuid(row.node_def_uuid)(survey)
  path.push(NodeDef.getLabel(lastNodeDef, i18n.lang))

  const errors = ValidationUtils.getValidationFieldMessagesHTML(i18n, false)(row.validation)

  const hierarchyKeys = row.keys_hierarchy[0].keys

  return (
    <>
      <div>
        {idx + offset + 1}
      </div>
      {
        nodeDefKeys.map((k, i) =>
          // TODO fix hierarchyKeys = null
          <div key={i}>{hierarchyKeys ? hierarchyKeys[Node.getUuid(k)] : ''}</div>
        )
      }
      <div>
        {path.join(' / ')}
      </div>
      <div>
        {errors}
      </div>
    </>
  )
}

const ValidationReportView = ({ canInvite, user, survey, surveyCycleKey, history }) => {
  useOnUpdate(() => {
    reloadListItems('validationReport') // TODO
  }, [surveyCycleKey])

  const onRowClick = record => {
    const parentNodeUuid = record.node_uuid
    const recordUuid = record.uuid
    const recordEditUrl = `${appModuleUri(dataModules.record)}${recordUuid}?parentNodeUuid=${parentNodeUuid}`

    history.push(recordEditUrl)
  }

  // const surveyInfo = Survey.getSurveyInfo(survey)
  const nodeDefRoot = Survey.getNodeDefRoot(survey)
  const nodeDefKeys = Survey.getNodeDefKeys(nodeDefRoot)(survey)

  const noCols = nodeDefKeys.length
  const gridTemplateColumns = `70px repeat(${noCols}, ${1 / noCols}fr) 200px 250px`

  return <TableView
    module={'validationReport'}
    gridTemplateColumns={gridTemplateColumns}
    rowHeaderComponent={ValidationReportRowHeader}
    rowComponent={ValidationReportRow}

    nodeDefKeys={nodeDefKeys}

    canInvite={canInvite}
    user={user}
    survey={survey}

    onRowClick={onRowClick}
  />
}

const mapStateToProps = state => {
  const survey = SurveyState.getSurvey(state)

  return {
    survey,
    nodeDefKeys: RecordsState.getNodeDefKeys(state),
    surveyCycleKey: SurveyState.getSurveyCycleKey(state),
  }
}

export default connect(mapStateToProps, { reloadListItems })(ValidationReportView)
