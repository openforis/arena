import React from 'react'

import { Button } from '@webapp/components/buttons'
import { useI18n } from '@webapp/store/system'
import { useFormPageEditButtons } from './useFormPageEditButtons'

export const FormPagesEditButtons = () => {
  const i18n = useI18n()
  const { onMoveUp, onMoveDown, upDisabled, downDisabled } = useFormPageEditButtons()

  return (
    <div className="survey-form__page-edit-buttons">
      <Button
        size="small"
        iconClassName="icon-arrow-up2 icon-12px"
        title={i18n.t('surveyForm.movePageUp')}
        disabled={upDisabled}
        onClick={onMoveUp}
      />
      <Button
        size="small"
        iconClassName="icon-arrow-down2 icon-12px"
        title={i18n.t('surveyForm.movePageDown')}
        disabled={downDisabled}
        onClick={onMoveDown}
      />
    </div>
  )
}
