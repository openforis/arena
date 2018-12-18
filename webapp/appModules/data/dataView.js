import './dataView.scss'

import React from 'react'

import TabBar from '../../commonComponents/tabBar'

import Records from './records/components/records'
import Record from './records/components/record'

import { appModules, appModuleUri } from '../appModules'
import { dataModules } from './dataModules'

class DataView extends React.Component {

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
              component: Records,
              path: appModuleUri(appModules.data),
            },

            //edit record
            {
              label: 'Record',
              component: Record,
              path: appModuleUri(dataModules.record) + ':recordUuid/',
              showTab: false,
            },

          ]}
        />

      </React.Fragment>
    )
  }

}

export default DataView