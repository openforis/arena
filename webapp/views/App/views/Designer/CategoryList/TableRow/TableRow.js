import React from 'react'

import * as Category from '@core/survey/category'

import ErrorBadge from '@webapp/components/errorBadge'
import WarningBadge from '@webapp/components/warningBadge'

import { useI18n } from '@webapp/store/system'
import { useAuthCanEditSurvey } from '@webapp/store/user'

import { State, useCategoryRow } from './store'

const TableRow = (props) => {
  const { state, Actions } = useCategoryRow(props)

  const i18n = useI18n()

  const canEdit = useAuthCanEditSurvey()

  const category = State.getCategory(state)
  const canSelect = State.getCanSelect(state)
  const position = State.getPosition(state)
  const selected = State.isSelected(state)
  const unused = State.isUnused(state)

  return (
    <>
      <div>{position}</div>
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
          <button
            type="button"
            className={`btn btn-s${selected ? ' active' : ''}`}
            onClick={() => Actions.select({ state })}
          >
            <span className={`icon icon-checkbox-${selected ? '' : 'un'}checked icon-12px icon-left`} />
            {i18n.t(selected ? 'common.selected' : 'common.select')}
          </button>
        </div>
      )}
      {canEdit && (
        <>
          <div>
            <button type="button" className="btn btn-s" onClick={() => Actions.edit({ state })}>
              <span className="icon icon-pencil2 icon-12px icon-left" />
              {i18n.t('common.edit')}
            </button>
          </div>
          <div>
            <button type="button" className="btn btn-s" onClick={() => Actions.delete({ state })}>
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
