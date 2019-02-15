import './dataQueryView.scss'

import React from 'react'

import NodeDefsSelector from '../components/nodeDefsSelector'
import DataTable from './dataTable'

const DataQueryView = () => {

  return (
    <div className="data-query">

      <NodeDefsSelector/>
      <div/>
      <DataTable/>

    </div>
  )

}

export default DataQueryView