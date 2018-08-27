import React from 'react'
import connect from 'react-redux/es/connect/connect'

import { getGlobalCurrentRecord } from '../../record/recordState'
import SurveyFormView from '../../survey/components/surveyFormView'

class DataEntryView extends React.Component {

  render() {
    return (
      <SurveyFormView draft={false} edit={false} entry={true} />
    )
  }
}


const mapStateToProps = state => ({
  record: getGlobalCurrentRecord(state)
})

export default connect(mapStateToProps)(DataEntryView)