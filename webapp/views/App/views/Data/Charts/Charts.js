import './Charts.scss'
import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import axios from 'axios'
import * as A from '@core/arena'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { Query } from '@common/model/query'
import { useSurvey, useSurveyId, useSurveyCycleKey } from '@webapp/store/survey'

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

const buildSpec = ({ dimensions = [], survey, showStackedLegent = false } = {}) => {
  const [dimension] = dimensions

  const spec = {
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
        mark: { type: 'arc', innerRadius: 40, outerRadius: 60 },
      },
      ...(showStackedLegent
        ? [
            {
              mark: { type: 'text', radius: 75 },
              encoding: {
                text: {
                  field: `${NodeDef.getName(Survey.getNodeDefByUuid(dimension)(survey))}_label`,
                  type: 'nominal',
                },
              },
            },
          ]
        : []),
    ],
    encoding: {
      theta: {
        field: `${NodeDef.getName(Survey.getNodeDefByUuid(dimension)(survey))}_label`,
        type: 'nominal',
        aggregate: 'count',
        impute: {
          value: 'NULL',
        },
        stack: showStackedLegent ? true : false,
      },
      color: {
        field: `${NodeDef.getName(Survey.getNodeDefByUuid(dimension)(survey))}_label`,
        type: 'nominal',
        /*legend: {
          title: 'Tree health',
        },*/
        legend: {
          titleFontSize: 8,
          labelFontSize: 5,
        },

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
  return spec
}

const Charts = () => { 
  const [entityDefUuid, setEntityDefUuid] = useState(null)
  const [dimensionDefUuids, setDimensionDefUuids] = useState([])
  const [chartImage, setChartImage] = useState(null)
  // const [showStackedLegent, setShowStackedLegend] = useState(false)

  const survey = useSurvey()
  const surveyId = useSurveyId()
  const cycle = useSurveyCycleKey()

  useEffect(() => {
    const getChart = async () => {
      try {
        if (dimensionDefUuids.length <= 0) return
        const { data } = await axios.post(getUrl({ surveyId, query: Query.create({ entityDefUuid }) }), {
          cycle,
          query: A.stringify(Query.create({ entityDefUuid })),
          chart: A.stringify(buildSpec({ dimensions: dimensionDefUuids, survey })),
        })
        setChartImage(data.svg)
      } catch (err) {
        console.log(err)
      }
    }
    getChart()
    return () => {}
  }, [surveyId, cycle, entityDefUuid, dimensionDefUuids])

  return (
    <div className="charts">
      <Chart src={chartImage ? `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(chartImage)))}` : false} />
      <Panel
        setEntityDefUuid={setEntityDefUuid}
        entityDefUuid={entityDefUuid}
        setDimensionDefUuids={setDimensionDefUuids}
        dimensionDefUuids={dimensionDefUuids}
      />
    </div>
  )
}

export default Charts
