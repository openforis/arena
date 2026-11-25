import './ButtonPublishSurvey.scss'

import classNames from 'classnames'

import * as Survey from '@core/survey/survey'
import { notifySuggestionEvent } from '@webapp/ai/suggestions/suggestionEvents'
import { useAppDispatch } from '@webapp/store/hooks'
import { SurveyActions, useIsSurveyDirty, useSurveyInfo, useSurveyPreferredLang } from '@webapp/store/survey'
import { DialogConfirmActions } from '@webapp/store/ui'
import { TestId } from '@webapp/utils/testId'

import { Button } from './buttons'
import { useKeyboardShiftKeyPressed } from './hooks'

type ButtonPublishSurveyProps = {
  className?: string
  disabled?: boolean
  variant?: 'contained' | 'outlined' | 'text'
}

const ButtonPublishSurvey = (props: ButtonPublishSurveyProps) => {
  const { className, disabled = false, variant = 'outlined' } = props

  const dispatch = useAppDispatch()
  const surveyInfo = useSurveyInfo()
  const surveyIsDirty = useIsSurveyDirty()
  const lang = useSurveyPreferredLang()
  const shiftPressed = useKeyboardShiftKeyPressed()

  const surveyLabel = Survey.getLabel(surveyInfo, lang)

  return (
    <Button
      className={classNames('btn-publish-survey', className)}
      disabled={disabled || surveyIsDirty}
      iconClassName="icon-warning icon-left icon-10px"
      label="common.publish"
      onClick={() => {
        // suggestion 3: offer to fix the entries with errors before the server refuses the publish
        notifySuggestionEvent({ type: 'publishClicked' })
        dispatch(
          DialogConfirmActions.showDialogConfirm({
            key: 'common.publishConfirm',
            params: { survey: surveyLabel },
            onOk: SurveyActions.publishSurvey({ cleanupRecords: shiftPressed }),
          })
        )
      }}
      size="small"
      testId={TestId.header.surveyPublishBtn}
      variant={variant}
    />
  )
}

export default ButtonPublishSurvey
