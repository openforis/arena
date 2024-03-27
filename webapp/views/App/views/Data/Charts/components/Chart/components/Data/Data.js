import './Data.scss'

import React from 'react'
import PropTypes from 'prop-types'

import DataTable from '../DataTable'

const Data = ({ data, fullScreen }) => {
  if (!fullScreen) return <></>
  return (
    <div className="charts_chart__data_container">
      <h2>Data</h2>

      <div className="charts_chart__data_container__table_container">
        <DataTable data={data} />
      </div>
    </div>
  )
}

Data.propTypes = {
  data: PropTypes.object,
  fullScreen: PropTypes.bool,
}

export default Data
