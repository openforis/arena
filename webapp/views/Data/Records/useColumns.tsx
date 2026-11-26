import { useMemo } from 'react'

import { Authorizer } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as DateUtils from '@core/dateUtils'
import * as Record from '@core/record/record'
import * as NodeDef from '@core/survey/nodeDef'
import * as Validation from '@core/validation/validation'
import { ButtonIconEditOrView } from '@webapp/components'
import { CreatedWithAppIcon } from '@webapp/components/CreatedWithAppIcon'
import ErrorBadge from '@webapp/components/ErrorBadge'
import { TableCellFiles } from '@webapp/components/Table/TableCellFiles'
import { TableSelectionColumn } from '@webapp/components/Table/TableSelectionColumn'
import { useNodeDefRootKeys, useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'
import { useRootSummaryDefs, useSurveyHasFileAttributes, useSurveySrsIndex } from '@webapp/store/survey/hooks'
import { useUser } from '@webapp/store/user'
import { TestId } from '@webapp/utils/testId'

import { RecordDeleteButton } from './RecordDeleteButton'
import { RecordKeyValuesExtractor } from './recordKeyValuesExtractor'
import { RecordOwnerColumn } from './RecordOwnerColumn'

export const useColumns = ({ categoryItemsByCodeDefUuid, navigateToRecord, onRecordsUpdate }) => {
  const survey = useSurvey()
  const lang = useSurveyPreferredLang()
  const srsIndex = useSurveySrsIndex()
  const user = useUser()
  const nodeDefKeys = useNodeDefRootKeys()
  const summaryDefs = useRootSummaryDefs()
  const hasFileAttributes = useSurveyHasFileAttributes()

  return useMemo(() => {
    if (categoryItemsByCodeDefUuid === null) return null
    return [
      TableSelectionColumn(),
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
      ...[...nodeDefKeys, ...summaryDefs].map((nodeDef) => ({
        key: NodeDef.getUuid(nodeDef),
        sortable: true,
        sortField: NodeDef.getName(nodeDef),
        header: NodeDef.getLabel(nodeDef, lang),
        headerIsTranslationKey: false,
        renderItem: ({ item: record }) => {
          const name = NodeDef.getName(nodeDef)
          const uuid = NodeDef.getUuid(nodeDef)
          const value = RecordKeyValuesExtractor.extractKeyOrSummaryValue({
            survey,
            nodeDef,
            record,
            categoryItemsByCodeDefUuid,
            lang,
            srsIndex,
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
        renderItem: ({ item: record }) => DateUtils.formatDateTimeDisplay(Record.getDateCreated(record)),
        width: '11rem',
      },
      {
        key: 'created-with',
        header: 'common.createdWith',
        hidden: true,
        renderItem: ({ item: record }) => <CreatedWithAppIcon appId={Record.getCreatedWithAppId(record)} />,
        width: '8rem',
      },
      {
        key: Record.keys.dateModified,
        header: 'common.dateLastModified',
        sortable: true,
        renderItem: ({ item: record }) => DateUtils.formatDateTimeDisplay(Record.getDateModified(record)),
        width: '11rem',
      },
      ...(hasFileAttributes
        ? [
            {
              key: 'files',
              className: 'files-col',
              header: 'files.header',
              hidden: true,
              renderItem: TableCellFiles,
              width: '4rem',
            },
          ]
        : []),
      {
        key: Record.keys.ownerName,
        className: 'width100',
        header: 'dataView:records.owner',
        hidden: true,
        renderItem: RecordOwnerColumn,
        sortable: true,
        width: 'minmax(auto, 15rem)',
      },
      {
        key: Record.keys.step,
        header: 'dataView:records.step',
        sortable: true,
        renderItem: ({ item: record }) => Record.getStep(record),
        width: '5rem',
      },
      {
        key: 'errors',
        header: 'common.error_other',
        renderItem: ({ item: record }) => A.pipe(Validation.getValidation, Validation.getErrorsCount)(record),
        width: '6rem',
      },
      {
        key: 'warnings',
        header: 'common.warning_other',
        renderItem: ({ item: record }) => A.pipe(Validation.getValidation, Validation.getWarningsCount)(record),
        width: '6rem',
      },
      {
        key: 'action-buttons',
        className: 'action-buttons-col',
        renderItem: ({ item: record, itemPosition }) => {
          // records of other user groups can only be viewed
          const readOnly = Record.isReadOnly(record)
          const canEdit = !readOnly && Authorizer.canEditRecord(user, record)
          const canDelete = !readOnly && Authorizer.canDeleteRecord(user, record)
          return (
            <>
              <ButtonIconEditOrView
                canEdit={canEdit}
                title={`dataView:records.${canEdit ? 'editRecord' : 'viewRecord'}`}
                onClick={() => navigateToRecord(record)}
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
  }, [
    categoryItemsByCodeDefUuid,
    hasFileAttributes,
    lang,
    nodeDefKeys,
    navigateToRecord,
    onRecordsUpdate,
    srsIndex,
    summaryDefs,
    survey,
    user,
  ])
}
