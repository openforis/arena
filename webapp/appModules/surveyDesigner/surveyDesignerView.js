import './style.scss'

import React from 'react'

import TabBar from '../../commonComponents/tabBar'
import SurveyInfoComponent from './components/surveyInfoComponent'
import SurveyFormView from '../../survey/components/surveyFormView'

const SurveyDesignerView = () => (

  <TabBar
    className="survey-designer grid100"
    tabs={[
      {label: 'Survey Info', component: SurveyInfoComponent},
      {label: 'Form Designer', component: SurveyFormView, props: {edit: true, draft: true}},
    ]}/>

)

export default SurveyDesignerView