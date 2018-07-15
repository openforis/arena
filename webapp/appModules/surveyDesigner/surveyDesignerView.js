import React from 'react'

import DataFetchComponent from '../components/moduleDataFetchComponent'
import { appModules } from '../appModules'

class SurveyDesignerView extends React.Component {

  render () {
    return (
      <DataFetchComponent module={appModules.surveyDesigner}>
        <div className="">
          Survey Designer
        </div>
      </DataFetchComponent>
    )
  }

}

export default SurveyDesignerView