import React from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'

import { Button } from './buttons'
import { SurveyActions, useSurveyInfo, useSurveyPreferredLang } from '@webapp/store/survey'
import { DialogConfirmActions } from '@webapp/store/ui'
import { TestId } from '@webapp/utils/testId'

const ButtonPublishSurvey = (props) => {
  const { className, disabled, variant } = props

  const dispatch = useDispatch()
  const surveyInfo = useSurveyInfo()
  const lang = useSurveyPreferredLang()

  const surveyLabel = Survey.getLabel(surveyInfo, lang)

  return (
    <Button
      className={`btn btn-s btn-publish ${className || ''}`}
      disabled={disabled}
      data-testid={TestId.header.surveyPublishBtn}
      iconClassName="icon-warning icon-left icon-10px"
      label="common.publish"
      onClick={() =>
        dispatch(
          DialogConfirmActions.showDialogConfirm({
            key: 'common.publishConfirm',
            params: { survey: surveyLabel },
            onOk: SurveyActions.publishSurvey(),
          })
        )
      }
      variant={variant}
    />
  )
}

ButtonPublishSurvey.propTypes = {
  className: PropTypes.string,
  disabled: PropTypes.bool,
  variant: PropTypes.string,
}

ButtonPublishSurvey.defaultProps = {
  className: null,
  disabled: false,
}

export default ButtonPublishSurvey
