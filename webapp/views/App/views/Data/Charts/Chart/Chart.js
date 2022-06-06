import React from 'react'
import PropTypes from 'prop-types'

const Chart = ({ src }) => {
  return (
    <div className="charts_chart__container">{src ? <img src={src} alt="" width="100%" height="100%" /> : <></>}</div>
  )
}

Chart.propTypes = {
  src: PropTypes.string.isRequired,
}

export default Chart
