import './Records.scss'

import React, { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'

import * as A from '@core/arena'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Validation from '@core/validation/validation'
import * as DateUtils from '@core/dateUtils'
import * as Authorizer from '@core/auth/authorizer'

import { WebSocketEvents } from '@common/webSocket/webSocketEvents'

import { useSurveyCycleKey, useNodeDefRootKeys, useSurveyPreferredLang } from '@webapp/store/survey'

import { appModuleUri, dataModules } from '@webapp/app/appModules'

import Table from '@webapp/components/Table'
import { useOnWebSocketEvent } from '@webapp/components/hooks'

import HeaderLeft from './HeaderLeft'
import ErrorBadge from '@webapp/components/errorBadge'
import { TestId } from '@webapp/utils/testId'
import { Button } from '@webapp/components'
import { useUser } from '@webapp/store/user'

import { useNodeDefKeysCategoryItemsInLevel } from './useNodeDefKeysCategoryItemsInLevel'
import { RecordKeyValuesExtractor } from './recordKeyValuesExtractor'
import { RecordDeleteButton } from './RecordDeleteButton'

const Records = () => {
  const navigate = useNavigate()
  const cycle = useSurveyCycleKey()
  const nodeDefKeys = useNodeDefRootKeys()
  const lang = useSurveyPreferredLang()
  const user = useUser()

  const categoryItemsByCodeDefUuid = useNodeDefKeysCategoryItemsInLevel()

  const [recordsRequestedAt, setRecordsRequestedAt] = useState(Date.now())

  const noCols = 3 + nodeDefKeys.length
  const gridTemplateColumns = `30px 70px repeat(${noCols}, ${1 / noCols}fr) 80px 80px 80px 80px`

  const navigateToRecord = useCallback(
    (record) => navigate(`${appModuleUri(dataModules.record)}${Record.getUuid(record)}`),
    [navigate]
  )
  const refreshData = useCallback(() => {
    setRecordsRequestedAt(Date.now())
  }, [setRecordsRequestedAt])

  const onRecordsUpdate = refreshData

  const onRecordEditButtonClick = (record) => (event) => {
    event.stopPropagation()
    event.preventDefault()

    navigateToRecord(record)
  }

  useOnWebSocketEvent({
    eventName: WebSocketEvents.recordDelete,
    eventHandler: refreshData,
  })

  return (
    <Table
      module="records/summary"
      restParams={{ cycle, recordsRequestedAt }}
      className="records"
      gridTemplateColumns={gridTemplateColumns}
      headerLeftComponent={HeaderLeft}
      headerProps={{ onRecordsUpdate, navigateToRecord }}
      rowProps={{ onRecordsUpdate, navigateToRecord, categoryItemsByCodeDefUuid }}
      noItemsLabelKey="dataView.records.noRecordsAdded"
      noItemsLabelForSearchKey="dataView.records.noRecordsAddedForThisSearch"
      onRowDoubleClick={navigateToRecord}
      columns={[
        {
          key: 'selected',
          renderItem: ({ itemSelected }) => (
            <div>
              <span className={`icon icon-12px icon-action icon-checkbox-${itemSelected ? 'checked' : 'unchecked'}`} />
            </div>
          ),
          width: '30px',
        },
        {
          key: 'row-number',
          header: '#',
          renderItem: ({ item: record, itemPosition }) => (
            <div>
              <ErrorBadge
                validation={Validation.getValidation(record)}
                showLabel={false}
                className="error-badge-inverse"
              />
              {itemPosition}
            </div>
          ),
        },
        ...nodeDefKeys.map((nodeDef) => ({
          key: NodeDef.getUuid(nodeDef),
          sortable: true,
          sortField: NodeDef.getName(nodeDef),
          header: NodeDef.getLabel(nodeDef, lang),
          renderItem: ({ item: record }) => {
            const name = NodeDef.getName(nodeDef)
            const uuid = NodeDef.getUuid(nodeDef)
            const value = RecordKeyValuesExtractor.extractKeyValue({
              nodeDef,
              record,
              categoryItemsByCodeDefUuid,
              lang,
            })
            return (
              <div key={uuid} data-testid={TestId.records.cellNodeDef(name)} data-value={value}>
                {value}
              </div>
            )
          },
        })),
        {
          key: Record.keys.dateCreated,
          header: 'common.dateCreated',
          sortable: true,
          renderItem: ({ item: record }) => DateUtils.formatDateTimeDisplay(Record.getDateCreated(record)),
        },
        {
          key: Record.keys.dateModified,
          header: 'common.dateLastModified',
          sortable: true,
          renderItem: ({ item: record }) => DateUtils.formatDateTimeDisplay(Record.getDateModified(record)),
        },
        {
          key: Record.keys.ownerName,
          header: 'dataView.records.owner',
          renderItem: ({ item: record }) => Record.getOwnerName(record),
        },
        {
          key: Record.keys.step,
          header: 'dataView.records.step',
          sortable: true,
          renderItem: ({ item: record }) => Record.getStep(record),
        },
        {
          key: 'errors',
          header: 'common.error_plural',
          renderItem: ({ item: record }) => A.pipe(Validation.getValidation, Validation.getErrorsCount)(record),
        },
        {
          key: 'warnings',
          header: 'common.warning_plural',
          renderItem: ({ item: record }) => A.pipe(Validation.getValidation, Validation.getWarningsCount)(record),
        },
        {
          key: 'action-buttons',
          renderItem: ({ item: record, itemPosition }) => {
            const canEdit = Authorizer.canEditRecord(user, record)
            const canDelete = Authorizer.canDeleteRecord(user, record)
            return (
              <>
                <Button
                  iconClassName={`icon-12px icon-action ${canEdit ? 'icon-pencil2' : 'icon-eye'}`}
                  title={`dataView.records.${canEdit ? 'editRecord' : 'viewRecord'}`}
                  onClick={onRecordEditButtonClick(record)}
                />
                {canDelete && (
                  <RecordDeleteButton
                    categoryItemsByCodeDefUuid={categoryItemsByCodeDefUuid}
                    onRecordsUpdate={onRecordsUpdate}
                    record={record}
                    testId={TestId.records.tableRowDeleteButton(itemPosition - 1)}
                  />
                )}
              </>
            )
          },
        },
      ]}
    />
  )
}

export default Records
