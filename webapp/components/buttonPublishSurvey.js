import React from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'

import { SurveyActions } from '@webapp/store/survey'
import { DialogConfirmActions } from '@webapp/store/ui'
import { useSurveyInfo, useI18n } from '@webapp/components/hooks'

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
      onClick={() =>
        dispatch(
          DialogConfirmActions.showDialogConfirm({
            key: 'common.publishConfirm',
            params: { survey: surveyLabel },
            onOk: SurveyActions.publishSurvey(),
          })
        )
      }
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
