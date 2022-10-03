import React from 'react'
import PropTypes from 'prop-types'
import Split from 'react-split'
import Data from './components/Data'

import './Chart.scss'

const Chart = ({ data, draft, renderChart, fullScreen }) => {
  return (
    <div className="charts_chart__container">
      {draft && (
        <div className="charts_chart_draft_overlay">
          <button onClick={renderChart}>rerender</button>
        </div>
      )}
      {data && !draft && (
        <Split sizes={[70, 30]} expandToMin={true} className="wrap wrap_vertical" direction="vertical">
          <div className="charts_chart__image_container">
            {data?.svg && (
              <img
                src={`data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(data?.svg)))}`}
                id="chartImg"
                alt=""
                width="100%"
                height="100%"
              />
            )}
          </div>
          {data?.table && <Data data={data} fullScreen={fullScreen} />}
        </Split>
      )}
    </div>
  )
}

Chart.propTypes = {
  data: PropTypes.object,
  fullScreen: PropTypes.bool,
  draft: PropTypes.bool,
  renderChart: PropTypes.func.isRequired,
}

export default Chart
