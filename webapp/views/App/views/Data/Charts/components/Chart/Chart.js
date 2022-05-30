import React from 'react'
import PropTypes from 'prop-types'

const Chart = ({ src }) => {
  return <>{src ? <img src={src} alt="" width="100%" height="100%" /> : <></>}</>
}

Chart.propTypes = {
  src: PropTypes.string.isRequired,
}

export default Chart
