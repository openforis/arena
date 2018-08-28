import React from 'react'

import DataFetchComponent from '../components/moduleDataFetchComponent'
import { appModules } from '../appModules'

class DataView extends React.Component {

  render () {
    return (
      <DataFetchComponent module={appModules.data}>
        <div className="">
          Data Explorer
        </div>
      </DataFetchComponent>
    )
  }

}

export default DataView