import './style.scss'

import React from 'react'

import TabBarComponent from '../../commonComponents/tabBarComponent'
import SurveyInfoComponent from './components/surveyInfoComponent'
import FormDesignerComponent from './components/formDesignerComponent'

const SurveyDesignerView = () => (
  <div className="survey-designer grid100">

    <TabBarComponent
      tabs={[
        {label: 'Survey Info', component: SurveyInfoComponent},
        {label: 'Form Designer', component: FormDesignerComponent},
      ]}/>

  </div>
)

export default SurveyDesignerView