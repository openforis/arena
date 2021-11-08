import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import axios from 'axios'
import * as A from '@core/arena'

import { useI18n } from '@webapp/store/system'
import { Query } from '@common/model/query'
import { useSurveyId, useSurveyCycleKey } from '@webapp/store/survey'
import PanelRight from '@webapp/components/PanelRight'

export const getUrl = ({ surveyId, query }) => `/api/surveyRdb/${surveyId}/${Query.getEntityDefUuid(query)}/chart`

/*
 TODO, extract this spec configuration to a pannelRight and manange a Chart class

 three modes, basic [ choose between templates and then allow the user to modify some basic fields ]
 custom [ customize the charts based on different properties -> the most complex to implement ]
 advance -> define the spec using a JSON editor

 Maybe the only thing that the user needs to chose on the left pannel is the last entity
*/

const defaultSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  /*name: 'tree_health_label',
  description: 'tree_health_label',
  title: {
    text: 'tree_health_label',
  },*/
  /*width: 500,
  height: 500,
  autosize: {
    type: 'fit',
    contatins: 'padding',
    resize: true,
  },*/
  /*data: {
    name: 'table',
    values: [],
  },*/

  layer: [
    {
      mark: { type: 'arc', innerRadius: 60, outerRadius: 80 },
    },
    /*{
    mark: {type: "text", radius: 120},
    encoding: {
      text: {field: "tree_health_label", type: "nominal"}
    }
  }*/
  ],
  encoding: {
    theta: {
      field: 'tree_health_label',
      type: 'nominal',
      aggregate: 'count',
      impute: {
        value: 'NULL',
      },
      //stack: true
    },
    color: {
      field: 'tree_health_label',
      type: 'nominal',
      /*legend: {
        title: 'Tree health',
      },*/

      impute: {
        value: 'NULL',
      },
    },
    /*column: {
      field: 'tree_origin_label',
      type: 'nominal',
      impute: {
        value: 'NULL',
      },
    },
    row: {
      field: 'cluster_accessibility_label',
      type: 'nominal',
      impute: {
        value: 'NULL',
      },
    },*/
  },
}

const updateCategoyOnDonnutChart =
  ({ chart: _chart }) =>
  ({ nodeDef }) => {
    return {
      ..._chart,
      encoding: {
        ..._chart.encoding,
        theta: { ..._chart.encoding.theta, field: nodeDef.name },
        color: { ..._chart.encoding.color, field: nodeDef.name },
      },
    }
  }

const Chart = (props) => {
  const { query } = props

  const [chart, setChart] = useState(defaultSpec)
  const [chartImage, setChartImage] = useState(null)
  const [showChartEditor, setShowChartEditor] = useState(true)

  const i18n = useI18n()
  const surveyId = useSurveyId()
  const cycle = useSurveyCycleKey()
  
  useEffect(() => {
    const getChart = async () => {
      try {
        const { data } = await axios.post(getUrl({ surveyId, query }), {
          cycle,
          query: A.stringify(query),
          chart: A.stringify(chart),
        })
        setChartImage(data.svg)
      } catch (err) {
        console.log(err)
      }
    }
    getChart()
    return () => {}
  }, [surveyId, cycle, query, chart])

  return (
    <div className="chart_container">
      <button onClick={() => setShowChartEditor(true)}>Show pannel</button>
      {chartImage && (
        <img
          src={`data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(chartImage)))}`}
          alt=""
          width="100%"
          height="100%"
        />
      )}
      {showChartEditor && (
        <PanelRight width="30vw" onClose={() => setShowChartEditor(false)} header={i18n.t('appModules.categories')}>
          <button
            onClick={() => setChart(updateCategoyOnDonnutChart({ chart })({ nodeDef: { name: 'tree_health_label' } }))}
          >
            tree_health_label
          </button>
          <button
            onClick={() => setChart(updateCategoyOnDonnutChart({ chart })({ nodeDef: { name: 'tree_origin_label' } }))}
          >
            tree_origin_label
          </button>

          <button
            onClick={() =>
              setChart(updateCategoyOnDonnutChart({ chart })({ nodeDef: { name: 'cluster_accessibility_label' } }))
            }
          >
            cluster_accessibility_label
          </button>
          <button
            onClick={() =>
              setChart(updateCategoyOnDonnutChart({ chart })({ nodeDef: { name: 'cluster_stratum_label' } }))
            }
          >
            cluster_stratum_label
          </button>

          <p>{JSON.stringify(chart, null, 2)}</p>
        </PanelRight>
      )}
    </div>
  )
}

Chart.propTypes = {
  query: PropTypes.object.isRequired,
}

export default Chart
