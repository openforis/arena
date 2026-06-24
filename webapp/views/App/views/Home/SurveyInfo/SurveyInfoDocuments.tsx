import { type SurveyDocImage } from '@core/survey/surveyDocImage'

import { useAuthCanEditSurvey } from '@webapp/store/user'

import SurveyDocImagesEditor from '../SurveyDocImagesEditor'

type Props = {
  surveyDocImages: SurveyDocImage[]
  setSurveyDocImages: (images: SurveyDocImage[]) => void
}

export const SurveyInfoDocuments = (props: Props) => {
  const { surveyDocImages, setSurveyDocImages } = props

  const readOnly = !useAuthCanEditSurvey()

  return (
    <div className="survey-info__documents">
      <SurveyDocImagesEditor
        surveyDocImages={surveyDocImages}
        setSurveyDocImages={setSurveyDocImages}
        readOnly={readOnly}
      />
    </div>
  )
}
