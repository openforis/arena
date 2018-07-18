import './style.scss'

import React from 'react'

import DataFetchComponent from '../components/moduleDataFetchComponent'
import { appModules } from '../appModules'

import TabBar from '../../commonComponents/tabBar'

class SurveyGeneralInfo extends React.Component {

  render () {
    return (
      <div className="form">

        <div className="form-item">
          <label className="form-label">Name</label>
          <input className="form-input"></input>
        </div>

        <div className="form-item">
          <label className="form-label">das</label>
          <input className="form-input"></input>
        </div>

      </div>
    )
  }

}

class FormDesigner extends React.Component {

  render () {
    return (
      <div>
        OO FormDesigner
      </div>
    )
  }

}

class SurveyDesignerView extends React.Component {

  render () {
    return (
      <DataFetchComponent module={appModules.surveyDesigner}>
        <div className="survey-designer">

          <TabBar
            tabs={[
              {label: 'Survey Info', component: SurveyGeneralInfo},
              {label: 'Form Designer', component: FormDesigner},
            ]}/>

        </div>
      </DataFetchComponent>
    )
  }

}

export default SurveyDesignerView