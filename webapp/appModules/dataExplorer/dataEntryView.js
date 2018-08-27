import React from 'react'

import SurveyFormView from '../../survey/components/surveyFormView'

class DataEntryView extends React.Component {

  render() {
    return (
      <SurveyFormView draft={false} edit={false} entry={true} />
    )
  }
}


export default DataEntryView