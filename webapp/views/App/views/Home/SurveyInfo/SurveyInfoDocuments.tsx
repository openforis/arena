import { type SurveyDocImage } from '@openforis/arena-core'

import { useAuthCanEditSurvey } from '@webapp/store/user'

import SurveyDocLayoutEditor from '../SurveyDocLayoutEditor'

type Props = {
  surveyDocImages: SurveyDocImage[]
  setSurveyDocImages: (images: SurveyDocImage[]) => void
  surveyDocOptions: Record<string, unknown>
  setSurveyDocOptions: (options: Record<string, unknown>) => void
}

export const SurveyInfoDocuments = (props: Props) => {
  const { surveyDocImages, setSurveyDocImages, surveyDocOptions, setSurveyDocOptions } = props

  const readOnly = !useAuthCanEditSurvey()

  return (
    <div className="survey-info__documents">
      <SurveyDocLayoutEditor
        surveyDocImages={surveyDocImages}
        setSurveyDocImages={setSurveyDocImages}
        surveyDocOptions={surveyDocOptions}
        setSurveyDocOptions={setSurveyDocOptions}
        readOnly={readOnly}
      />
    </div>
  )
}
