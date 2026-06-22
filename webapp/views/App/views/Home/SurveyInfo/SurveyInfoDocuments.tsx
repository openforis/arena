import React from 'react'

import { useAuthCanEditSurvey } from '@webapp/store/user'

import SurveyDocImagesEditor from '../SurveyDocImagesEditor'

type Props = {
  surveyDocImages: object[]
  setSurveyDocImages: (images: object[]) => void
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
