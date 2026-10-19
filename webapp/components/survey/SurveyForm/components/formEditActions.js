import { useState } from 'react'
import { useDispatch } from 'react-redux'

import { ENV } from '@core/processUtils'

import { RecordActions } from '@webapp/store/ui/record'
import { useIsSurveyDirty } from '@webapp/store/survey'
import { TestId } from '@webapp/utils/testId'
import { Button } from '@webapp/components/buttons'
import { MobilePreviewPanel } from '@webapp/components/survey/MobilePreview'

const FormEditActions = () => {
  const dispatch = useDispatch()
  const surveyIsDirty = useIsSurveyDirty()
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false)

  return (
    <div className="survey-form-header__actions">
      <Button
        disabled={surveyIsDirty}
        iconClassName="icon-eye icon-12px"
        label="surveyForm:formEditActions.preview"
        onClick={() => dispatch(RecordActions.createRecord({ preview: true }))}
        size="small"
        testId={TestId.surveyForm.previewOpenBtn}
        variant="text"
      />
      {ENV.mobilePreviewUrl && (
        <Button
          iconClassName="icon-mobile icon-12px"
          label="surveyForm:formEditActions.mobilePreview"
          onClick={() => setMobilePreviewOpen(true)}
          size="small"
          variant="text"
        />
      )}
      {mobilePreviewOpen && <MobilePreviewPanel onClose={() => setMobilePreviewOpen(false)} />}
    </div>
  )
}

export default FormEditActions
