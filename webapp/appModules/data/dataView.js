import './dataView.scss'

import React from 'react'
import { connect } from 'react-redux'

import TabBar from '../../commonComponents/tabBar'

import RecordsView from './records/components/recordsView'
import RecordView from './records/components/recordView'
import DataVisView from './dataVis/dataVisView'

import { appModules, appModuleUri } from '../appModules'
import { dataModules } from './dataModules'

import { initSurveyDefs } from '../../survey/actions'

class DataView extends React.Component {
  componentDidMount () {
    const {initSurveyDefs} = this.props
    initSurveyDefs()
  }

  render () {
    const {history, location} = this.props

    return (
      <React.Fragment>
        <TabBar
          className="data"
          location={location}
          history={history}
          tabs={[

            {
              label: 'Records',
              component: RecordsView,
              path: appModuleUri(appModules.data),
            },

            //edit record
            {
              label: 'Record',
              component: RecordView,
              path: appModuleUri(dataModules.record) + ':recordUuid/',
              showTab: false,
            },

            //edit record
            {
              label: 'Data vis',
              component: DataVisView,
              path: appModuleUri(dataModules.dataVis),
            },

          ]}
        />

      </React.Fragment>
    )
  }

}

export default connect(null, {initSurveyDefs})(DataView)
