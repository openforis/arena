import './dataView.scss'

import React from 'react'

import TabBar from '../../commonComponents/tabBar'

import Records from './records/records'

import { appModules, appModuleUri } from '../appModules'

class DataView extends React.Component {

  render () {
    const {history, location} = this.props

    return (
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

        ]}
      />
    )
  }

}

export default DataView