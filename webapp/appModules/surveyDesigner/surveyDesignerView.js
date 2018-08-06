import './style.scss'

import React from 'react'

import TabBar from '../../commonComponents/tabBar'
import SurveyInfoComponent from './components/surveyInfoComponent'
import SurveyFormView from '../../survey/components/surveyFormView'

const SurveyDesignerView = () => (
  <div className="survey-designer grid100">

    <TabBar
      tabs={[
        {label: 'Survey Info', component: SurveyInfoComponent},
        {label: 'Form Designer', component: SurveyFormView, props: {edit: true, draft: true}},
      ]}/>

  </div>
)

export default SurveyDesignerView