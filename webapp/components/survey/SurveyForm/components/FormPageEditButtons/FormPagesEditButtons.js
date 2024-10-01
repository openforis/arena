import React from 'react'

import { Button } from '@webapp/components/buttons'
import { useFormPageEditButtons } from './useFormPageEditButtons'

export const FormPagesEditButtons = () => {
  const { onMoveUp, onMoveDown, upDisabled, downDisabled } = useFormPageEditButtons()

  return (
    <div className="survey-form__page-edit-buttons">
      <Button
        size="small"
        iconClassName="icon-arrow-up2 icon-12px"
        title="surveyForm.movePageUp"
        disabled={upDisabled}
        onClick={onMoveUp}
      />
      <Button
        size="small"
        iconClassName="icon-arrow-down2 icon-12px"
        title="surveyForm.movePageDown"
        disabled={downDisabled}
        onClick={onMoveDown}
      />
    </div>
  )
}
