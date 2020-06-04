import React from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'

import { showDialogConfirm } from '@webapp/app/appDialogConfirm/actions'
import { publishSurvey } from '@webapp/survey/actions'
import { useSurveyInfo, useI18n } from './hooks'

const ButtonPublishSurvey = (props) => {
  const { className, disabled } = props

  const dispatch = useDispatch()
  const surveyInfo = useSurveyInfo()
  const i18n = useI18n()

  const surveyLabel = Survey.getLabel(surveyInfo, i18n.lang)

  return (
    <button
      type="button"
      aria-disabled={disabled}
      className={`btn btn-s btn-publish ${className || ''}`}
      onClick={() => dispatch(showDialogConfirm('common.publishConfirm', { survey: surveyLabel }, publishSurvey()))}
    >
      <span className="icon icon-warning icon-left icon-10px" />
      {i18n.t('common.publish')}
    </button>
  )
}

ButtonPublishSurvey.propTypes = {
  className: PropTypes.string,
  disabled: PropTypes.bool,
}

ButtonPublishSurvey.defaultProps = {
  className: null,
  disabled: false,
}

export default ButtonPublishSurvey
