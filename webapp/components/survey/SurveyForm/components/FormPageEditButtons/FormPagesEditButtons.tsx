import { Button } from '@webapp/components/buttons'

import { useFormPageEditButtons } from './useFormPageEditButtons'

export const FormPagesEditButtons = () => {
  const { onMoveUp, onMoveDown, upDisabled, downDisabled } = useFormPageEditButtons()

  return (
    <div className="survey-form__page-edit-buttons">
      <Button
        size="small"
        iconName="arrowUp"
        iconSize={14}
        title="surveyForm:movePageUp"
        disabled={upDisabled}
        onClick={onMoveUp}
      />
      <Button
        size="small"
        iconName="arrowDown"
        iconSize={14}
        title="surveyForm:movePageDown"
        disabled={downDisabled}
        onClick={onMoveDown}
      />
    </div>
  )
}
