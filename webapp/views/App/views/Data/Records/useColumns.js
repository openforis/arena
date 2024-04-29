import React, { useCallback, useMemo } from 'react'

import * as A from '@core/arena'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Validation from '@core/validation/validation'
import * as DateUtils from '@core/dateUtils'
import * as Authorizer from '@core/auth/authorizer'

import { useNodeDefRootKeys, useSurveyPreferredLang } from '@webapp/store/survey'

import { AppIcon } from '@webapp/components/AppIcon'
import ErrorBadge from '@webapp/components/errorBadge'
import { Button } from '@webapp/components'
import { TestId } from '@webapp/utils/testId'
import { useUser } from '@webapp/store/user'

import { RecordKeyValuesExtractor } from './recordKeyValuesExtractor'
import { RecordDeleteButton } from './RecordDeleteButton'
import { RecordOwnerColumn } from './RecordOwnerColumn'

export const useColumns = ({ categoryItemsByCodeDefUuid, navigateToRecord, onRecordsUpdate }) => {
  const lang = useSurveyPreferredLang()
  const user = useUser()
  const nodeDefKeys = useNodeDefRootKeys()

  const onRecordEditButtonClick = useCallback(
    (record) => (event) => {
      event.stopPropagation()
      event.preventDefault()

      navigateToRecord(record)
    },
    [navigateToRecord]
  )

  return useMemo(() => {
    if (categoryItemsByCodeDefUuid === null) return null
    return [
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
        width: '3rem',
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
        className: 'date-created-col',
        header: 'common.dateCreated',
        sortable: true,
        renderItem: ({ item: record }) => (
          <>
            {DateUtils.formatDateTimeDisplay(Record.getDateCreated(record))}
            <AppIcon appId={Record.getCreatedWithAppId(record)} />
          </>
        ),
        width: '12rem',
      },
      {
        key: Record.keys.dateModified,
        header: 'common.dateLastModified',
        sortable: true,
        renderItem: ({ item: record }) => DateUtils.formatDateTimeDisplay(Record.getDateModified(record)),
        width: '11rem',
      },
      {
        key: Record.keys.ownerName,
        className: 'width100',
        header: 'dataView.records.owner',
        renderItem: RecordOwnerColumn,
      },
      {
        key: Record.keys.step,
        header: 'dataView.records.step',
        sortable: true,
        renderItem: ({ item: record }) => Record.getStep(record),
        width: '5rem',
      },
      {
        key: 'errors',
        header: 'common.error_plural',
        renderItem: ({ item: record }) => A.pipe(Validation.getValidation, Validation.getErrorsCount)(record),
        width: '6rem',
      },
      {
        key: 'warnings',
        header: 'common.warning_plural',
        renderItem: ({ item: record }) => A.pipe(Validation.getValidation, Validation.getWarningsCount)(record),
        width: '6rem',
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
        width: '80px',
      },
    ]
  }, [categoryItemsByCodeDefUuid, lang, nodeDefKeys, onRecordEditButtonClick, onRecordsUpdate, user])
}
