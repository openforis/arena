import { useState } from 'react'
import { useNavigate } from 'react-router'

import { ENV } from '@core/processUtils'

import { appModuleUri, dataModules } from '@webapp/app/appModules'
import { Button, ButtonSplit } from '@webapp/components/buttons'
import { MobilePreviewPanel } from '@webapp/components/survey/MobilePreview'

/**
 * Opens the preview of the draft form (desktop or mobile) for data entry users, if enabled in the survey.
 * @returns {React.ReactElement} - The preview button.
 */
export const FormPreviewButton = () => {
  const navigate = useNavigate()
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false)

  const openDesktopPreview = () => navigate(appModuleUri(dataModules.formPreview))

  const buttonProps = {
    iconClassName: 'icon-eye icon-12px',
    label: 'dataView:records.formPreview',
    onClick: openDesktopPreview,
    title: 'dataView:records.formPreviewInfo',
    variant: 'outlined' as const,
  }

  return (
    <>
      {ENV.mobilePreviewUrl ? (
        <ButtonSplit
          {...buttonProps}
          items={[
            {
              key: 'desktop',
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
        <Button {...buttonProps} />
      )}
      {mobilePreviewOpen && <MobilePreviewPanel onClose={() => setMobilePreviewOpen(false)} />}
    </>
  )
}
