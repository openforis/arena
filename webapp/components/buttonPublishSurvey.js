import React from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'

import * as Survey from '@core/survey/survey'

import { SurveyActions, useSurveyInfo, useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { DialogConfirmActions } from '@webapp/store/ui'
import { TestId } from '@webapp/utils/testId'

const ButtonPublishSurvey = (props) => {
  const { className, disabled } = props

  const dispatch = useDispatch()
  const surveyInfo = useSurveyInfo()
  const i18n = useI18n()
  const lang = useSurveyPreferredLang()

  const surveyLabel = Survey.getLabel(surveyInfo, lang)

  return (
    <button
      type="button"
      aria-disabled={disabled}
      className={`btn btn-s btn-publish ${className || ''}`}
      data-testid={TestId.header.surveyPublishBtn}
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
