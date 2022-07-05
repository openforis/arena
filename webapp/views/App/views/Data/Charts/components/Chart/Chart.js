import React from 'react'
import PropTypes from 'prop-types'
import './Chart.scss'

const Chart = ({ src, draft, renderChart }) => {
  return (
    <div className="charts_chart__container">
      {src && (
        <img
          src={`data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(src)))}`}
          alt=""
          width="100%"
          height="100%"
        />
      )}
      {draft && (
        <div className="charts_chart_draft_overlay">
          <button onClick={renderChart}>rerender</button>
        </div>
      )}
    </div>
  )
}

Chart.propTypes = {
  src: PropTypes.string,
  draft: PropTypes.bool,
  renderChart: PropTypes.func.isRequired,
}

export default Chart
