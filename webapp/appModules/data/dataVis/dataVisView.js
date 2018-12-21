import './dataVisView.scss'

import React from 'react'

import NodeDefsSelector from './components/nodeDefsSelector'
import DataTable from './components/dataTable'

const DataVisView = (props) => {

  return (
    <div className="data-vis">

      <NodeDefsSelector/>

      <DataTable/>

    </div>
  )

}

export default DataVisView