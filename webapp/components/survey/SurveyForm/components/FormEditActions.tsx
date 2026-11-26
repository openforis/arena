import { useState } from 'react'

import { ENV } from '@core/processUtils'
import { Button, ButtonProps, ButtonSplit } from '@webapp/components/buttons'
import { MobilePreviewPanel } from '@webapp/components/survey/MobilePreview'
import { useAppDispatch } from '@webapp/store'
import { useIsSurveyDirty } from '@webapp/store/survey'
import { RecordActions } from '@webapp/store/ui/record'
import { TestId } from '@webapp/utils/testId'

const FormEditActions = () => {
  const dispatch = useAppDispatch()
  const surveyIsDirty = useIsSurveyDirty()
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false)

  const mobilePreviewAvailable = !!ENV.mobilePreviewUrl

  const openDesktopPreview = () => dispatch(RecordActions.createRecord({ preview: true }))

  const previewButtonProps: ButtonProps = {
    disabled: surveyIsDirty,
    iconName: 'view',
    iconSize: 14,
    label: 'surveyForm:formEditActions.preview',
    onClick: openDesktopPreview,
    size: 'small' as const,
    testId: TestId.surveyForm.previewOpenBtn,
    variant: 'contained' as const,
  }

  return (
    <div className="survey-form-header__actions">
      {mobilePreviewAvailable ? (
        // the main button opens the desktop preview, the menu lets choose the kind of preview
        <ButtonSplit
          {...previewButtonProps}
          items={[
            {
              key: 'desktop',
              disabled: surveyIsDirty,
              iconName: 'desktop',
              iconSize: 14,
              label: 'surveyForm:formEditActions.previewDesktop',
              onClick: openDesktopPreview,
            },
            {
              key: 'mobile',
              iconName: 'mobile',
              iconSize: 14,
              label: 'surveyForm:formEditActions.previewMobile',
              onClick: () => setMobilePreviewOpen(true),
            },
          ]}
          menuButtonTitle="surveyForm:formEditActions.previewOptions"
        />
      ) : (
        <Button {...previewButtonProps} />
      )}
      {mobilePreviewOpen && <MobilePreviewPanel onClose={() => setMobilePreviewOpen(false)} />}
    </div>
  )
}

export default FormEditActions
