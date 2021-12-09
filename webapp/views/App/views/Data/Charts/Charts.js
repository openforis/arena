import './Charts.scss'
import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import axios from 'axios'
import * as A from '@core/arena'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useI18n } from '@webapp/store/system'
import { Query } from '@common/model/query'
import { useSurvey, useSurveyId, useSurveyPreferredLang, useSurveyCycleKey } from '@webapp/store/survey'
import PanelRight from '@webapp/components/PanelRight'
import { EntitySelector } from '@webapp/components/survey/NodeDefsSelector'


import Chart from './Chart'
import Panel from './Panel'

export const getUrl = ({ surveyId, query }) => `/api/reporting/${surveyId}/${Query.getEntityDefUuid(query)}/chart`

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
  
const Chart = () => {

  const [chart, setChart] = useState(defaultSpec)
  const [entityDefUuid, setEntityDefUuid] = useState(null)
  const [chartImage, setChartImage] = useState(null)
  const [showChartEditor, setShowChartEditor] = useState(true)

  const i18n = useI18n()
  const lang = useSurveyPreferredLang()
  const survey = useSurvey()
  const surveyId = useSurveyId()
  const cycle = useSurveyCycleKey()

  useEffect(() => {
    const getChart = async () => {
      try {
        const { data } = await axios.post(getUrl({ surveyId, query: Query.create({ entityDefUuid }) }), {
          cycle,
          query: A.stringify(Query.create({ entityDefUuid })),
          chart: A.stringify(chart),
        })
        setChartImage(data.svg)
      } catch (err) {
        console.log(err)
      }
    }
    getChart()
    return () => {}
  }, [surveyId, cycle, chart, entityDefUuid])

  return (
    <div className="charts">
      <Visualizer src={`data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(chartImage)))}`} />
      <Panel  setEntityDefUuid={setEntityDefUuid} entityDefUuid={entityDefUuid}/>
    </div>
  )
}

export default Chart
