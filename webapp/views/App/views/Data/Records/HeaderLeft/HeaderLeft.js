import './HeaderLeft.scss'
import React from 'react'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import * as Survey from '@core/survey/survey'

import { useI18n } from '@webapp/store/system'
import { useSurveyInfo } from '@webapp/store/survey'
import { RecordActions } from '@webapp/store/ui/record'
import { DataTestId } from '@webapp/utils/dataTestId'

const HeaderLeft = ({ handleSearch, search, totalCount }) => {
  const dispatch = useDispatch()
  const history = useHistory()
  const surveyInfo = useSurveyInfo()
  const i18n = useI18n()

  return Survey.isPublished(surveyInfo) ? (
    <div className="records__header-left">
      <button
        data-testid={DataTestId.records.addBtn}
        type="button"
        onClick={() => dispatch(RecordActions.createRecord(history))}
        className="btn btn-s"
      >
        <span className="icon icon-plus icon-12px icon-left" />
        {i18n.t('common.new')}
      </button>

      { totalCount > 0 && <input
        className="records__header-left__input-search"
        placeholder="search..."
        defaultValue={search}
        onChange={(e) => handleSearch(e.target.value)}
      /> }
    </div>
  ) : (
    <div />
  )
}

export default HeaderLeft
