import React from 'react'

import * as Category from '@core/survey/category'

import ErrorBadge from '@webapp/components/errorBadge'
import WarningBadge from '@webapp/components/warningBadge'

import { useI18n } from '@webapp/store/system'

import { useTableRow } from './useTableRow'

const TableRow = (props) => {
  const { canEdit, canSelect, category, onDelete, onEdit, onSelect, rowPosition, selected, unused } = useTableRow(props)

  const i18n = useI18n()

  return (
    <>
      <div>{rowPosition}</div>
      <div>{Category.getName(category)}</div>
      {canEdit && (
        <>
          <div>
            <ErrorBadge validation={Category.getValidation(category)} />
          </div>
          <div>
            <WarningBadge show={unused} label={i18n.t('itemsTable.unused')} />
          </div>
        </>
      )}
      {canSelect && (
        <div>
          <button type="button" className={`btn btn-s${selected ? ' active' : ''}`} onClick={onSelect}>
            <span className={`icon icon-checkbox-${selected ? '' : 'un'}checked icon-12px icon-left`} />
            {i18n.t(selected ? 'common.selected' : 'common.select')}
          </button>
        </div>
      )}
      {canEdit && (
        <>
          <div>
            <button type="button" className="btn btn-s" onClick={onEdit}>
              <span className="icon icon-pencil2 icon-12px icon-left" />
              {i18n.t('common.edit')}
            </button>
          </div>
          <div>
            <button type="button" className="btn btn-s" onClick={onDelete}>
              <span className="icon icon-bin2 icon-12px icon-left" />
              {i18n.t('common.delete')}
            </button>
          </div>
        </>
      )}
    </>
  )
}

export default TableRow
