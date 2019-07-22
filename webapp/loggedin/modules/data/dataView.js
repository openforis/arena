import React from 'react'
import { connect } from 'react-redux'

import Survey from '../../../../common/survey/survey'

import InnerModuleSwitch from '../components/innerModuleSwitch'
import SurveyDefsLoader from '../../surveyViews/surveyDefsLoader/surveyDefsLoader'
import RecordsView from './records/components/recordsView'
import RecordView from './records/components/recordView'
import DataVisView from './dataVis/dataVisView'

import * as SurveyState from '../../../survey/surveyState'

import { appModules, appModuleUri, dataModules } from '../../appModules'

const DataView = ({ surveyInfo }) => {

  const draftDefs = Survey.isFromCollect(surveyInfo) && !Survey.isPublished(surveyInfo)

  return (
    <SurveyDefsLoader
      draft={draftDefs}
      validate={false}>

      <InnerModuleSwitch
        moduleRoot={appModules.data}
        moduleDefault={dataModules.records}
        modules={[
          // records list
          {
            component: RecordsView,
            path: appModuleUri(dataModules.records),
          },
          //edit record
          {
            component: RecordView,
            path: appModuleUri(dataModules.record) + ':recordUuid/',
            props: { draftDefs }
          },
          // data visualization
          {
            component: DataVisView,
            path: appModuleUri(dataModules.dataVis),
          },

        ]}
      />
    </SurveyDefsLoader>
  )
}

const mapStateToProps = state => ({
  surveyInfo: SurveyState.getSurveyInfo(state),
})

export default connect(mapStateToProps)(DataView)
