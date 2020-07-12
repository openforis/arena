import React from 'react'
import PropTypes from 'prop-types'

import * as Category from '@core/survey/category'

import ErrorBadge from '@webapp/components/errorBadge'
import WarningBadge from '@webapp/components/warningBadge'

import { useI18n } from '@webapp/store/system'
import { useAuthCanEditSurvey } from '@webapp/store/user'

import { State, useLocalState, useActions } from './store'
import { State as ListState } from '../store'

const TableRow = (props) => {
  const { idx, initData, listState, offset, row } = props

  const { state, setState } = useLocalState({ idx, initData, listState, offset, row })

  const i18n = useI18n()

  const canEdit = useAuthCanEditSurvey()

  const Actions = useActions({ setState })
  const canSelect = ListState.getCanSelect(listState)
  const category = State.getCategory(state)
  const selected = State.isSelected(state)

  return (
    <>
      <div>{State.getPosition(state)}</div>
      <div>{Category.getName(category)}</div>
      {canEdit && (
        <>
          <div>
            <ErrorBadge validation={Category.getValidation(category)} />
          </div>
          <div>
            <WarningBadge show={State.isUnused(state)} label={i18n.t('itemsTable.unused')} />
          </div>
        </>
      )}
      {canSelect && (
        <div>
          <button type="button" className={`btn btn-s${selected ? ' active' : ''}`} onClick={() => Actions.select()}>
            <span className={`icon icon-checkbox-${selected ? '' : 'un'}checked icon-12px icon-left`} />
            {i18n.t(selected ? 'common.selected' : 'common.select')}
          </button>
        </div>
      )}
      {canEdit && (
        <>
          <div>
            <button type="button" className="btn btn-s" onClick={() => Actions.edit()}>
              <span className="icon icon-pencil2 icon-12px icon-left" />
              {i18n.t('common.edit')}
            </button>
          </div>
          <div>
            <button type="button" className="btn btn-s" onClick={() => Actions.delete()}>
              <span className="icon icon-bin2 icon-12px icon-left" />
              {i18n.t('common.delete')}
            </button>
          </div>
        </>
      )}
    </>
  )
}

TableRow.propTypes = {
  idx: PropTypes.number.isRequired,
  initData: PropTypes.func.isRequired,
  listState: PropTypes.object.isRequired,
  offset: PropTypes.number.isRequired,
  row: PropTypes.object.isRequired,
}

export default TableRow
