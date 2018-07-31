import './style.scss'

import React from 'react'

import TabBarComponent from '../../commonComponents/tabBarComponent'
import SurveyInfoComponent from './components/surveyInfoComponent'
import FormRendererComponent from '../../survey/formRendererComponent'

const SurveyDesignerView = () => (
  <div className="survey-designer grid100">

    <TabBarComponent
      tabs={[
        {label: 'Survey Info', component: SurveyInfoComponent},
        {label: 'Form Designer', component: FormRendererComponent, props: {edit: true}},
      ]}/>

  </div>
)

export default SurveyDesignerView