import React from 'react'

import useI18n from '../../../../../commonComponents/useI18n'

import Survey from '../../../../../../common/survey/survey'

const RecordsHeaderLeft = props => {
  const { surveyInfo, createRecord, history } = props
  const i18n = useI18n()

  return Survey.isPublished(surveyInfo)
    ? (
      <button onClick={() => createRecord(history)} className="btn btn-s">
        <span className="icon icon-plus icon-12px icon-left"/>
        {i18n.t('common.new')}
      </button>
    )
    : <div/>
}

export default RecordsHeaderLeft
