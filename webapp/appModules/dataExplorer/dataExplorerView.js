import React from 'react'

import DataFetchComponent from '../components/moduleDataFetchComponent'
import { appModules } from '../appModules'

class DataExplorerView extends React.Component {

  render () {
    return (
      <DataFetchComponent module={appModules.dataExplorer}>
        <div className="">
          Data Explorer
        </div>
      </DataFetchComponent>
    )
  }

}

export default DataExplorerView