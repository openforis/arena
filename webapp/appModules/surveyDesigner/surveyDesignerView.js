import './style.scss'

import React from 'react'

import TabBar from '../../commonComponents/tabBar'
import SurveyInfoComponent from './components/surveyInfoComponent'
import FormDesignerComponent from './components/formDesignerComponent'

const SurveyDesignerView = () => (
  <div className="survey-designer grid100">

    <TabBar
      tabs={[
        {label: 'Survey Info', component: SurveyInfoComponent},
        {label: 'Form Designer', component: FormDesignerComponent},
      ]}/>

  </div>
)

export default SurveyDesignerView