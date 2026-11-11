import { useState } from 'react'
import { useDispatch } from 'react-redux'

import { ENV } from '@core/processUtils'

import { RecordActions } from '@webapp/store/ui/record'
import { useIsSurveyDirty } from '@webapp/store/survey'
import { TestId } from '@webapp/utils/testId'
import { Button, ButtonSplit } from '@webapp/components/buttons'
import { MobilePreviewPanel } from '@webapp/components/survey/MobilePreview'

const FormEditActions = () => {
  const dispatch = useDispatch()
  const surveyIsDirty = useIsSurveyDirty()
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false)

  const mobilePreviewAvailable = !!ENV.mobilePreviewUrl

  const openDesktopPreview = () => dispatch(RecordActions.createRecord({ preview: true }))

  const previewButtonProps = {
    disabled: surveyIsDirty,
    iconClassName: 'icon-eye icon-12px',
    label: 'surveyForm:formEditActions.preview',
    onClick: openDesktopPreview,
    size: 'small',
    testId: TestId.surveyForm.previewOpenBtn,
    variant: 'contained',
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
              iconClassName: 'icon-display icon-12px',
              label: 'surveyForm:formEditActions.previewDesktop',
              onClick: openDesktopPreview,
            },
            {
              key: 'mobile',
              iconClassName: 'icon-mobile icon-12px',
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
