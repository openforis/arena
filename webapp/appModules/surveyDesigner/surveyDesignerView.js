import './style.scss'

import React from 'react'

// import DataFetchComponent from '../components/moduleDataFetchComponent'
// import { appModules } from '../appModules'

import TabBar from '../../commonComponents/tabBar'
import SurveyInfoComponent from './components/surveyInfoComponent'
import FormRendererComponent from '../../survey/formRenderer/formRendererComponent'

class SurveyDesignerView extends React.Component {

  //<DataFetchComponent module={appModules.surveyDesigner}>
  // </DataFetchComponent>

  render () {
    return (
      <div className="survey-designer">

        <TabBar
          tabs={[
            {label: 'Survey Info', component: SurveyInfoComponent},
            {label: 'Form Designer', component: FormRendererComponent},
          ]}/>

      </div>
    )
  }

}

export default SurveyDesignerView