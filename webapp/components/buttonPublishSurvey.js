import React from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'

import { SurveyActions, useIsSurveyDirty, useSurveyInfo, useSurveyPreferredLang } from '@webapp/store/survey'
import { DialogConfirmActions } from '@webapp/store/ui'
import { TestId } from '@webapp/utils/testId'
import { Button } from './buttons'

const ButtonPublishSurvey = (props) => {
  const { className, disabled = false, variant = 'outlined' } = props

  const dispatch = useDispatch()
  const surveyInfo = useSurveyInfo()
  const surveyIsDirty = useIsSurveyDirty()
  const lang = useSurveyPreferredLang()

  const surveyLabel = Survey.getLabel(surveyInfo, lang)

  return (
    <Button
      className={className}
      disabled={disabled || surveyIsDirty}
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
      size="small"
      testId={TestId.header.surveyPublishBtn}
      variant={variant}
    />
  )
}

ButtonPublishSurvey.propTypes = {
  className: PropTypes.string,
  disabled: PropTypes.bool,
  variant: PropTypes.string,
}

export default ButtonPublishSurvey
