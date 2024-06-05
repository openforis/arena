import './AggregateFunctionsPanel.scss'

import React from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import { Query } from '@common/model/query'

import { Button } from '@webapp/components/buttons'
import PanelRight from '@webapp/components/PanelRight'

import { useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

import { CustomAggregateFunctionsEditor } from './CustomAggregateFunctionsEditor'

export const AggregateFunctionsPanel = (props) => {
  const { aggregateFunctions, nodeDef, onChangeQuery, onClose, query } = props

  const i18n = useI18n()
  const survey = useSurvey()
  const lang = useSurveyPreferredLang()

  const customAggregateFunctionUuids = aggregateFunctions.filter(
    (fn) => !Object.values(Query.DEFAULT_AGGREGATE_FUNCTIONS).includes(fn)
  )

  const entityDefUuid = Query.getEntityDefUuid(query)
  const entityDef = Survey.getNodeDefByUuid(entityDefUuid)(survey)

  const nodeDefUuid = NodeDef.getUuid(nodeDef)
  const nodeDefLabel = NodeDef.getLabel(nodeDef, lang)

  return (
    <PanelRight
      className="aggregate-functions-panel"
      header={`${nodeDefLabel} ${i18n.t('common.aggregateFunction', { count: 2 })}`}
      onClose={onClose}
      showFooter
      width="700px"
    >
      <div>
        {Object.keys(Query.DEFAULT_AGGREGATE_FUNCTIONS).map((aggregateFn) => (
          <Button
            key={aggregateFn}
            className="btn-aggregate-fn deselectable"
            label={`common.${aggregateFn}`}
            onClick={() => onChangeQuery(Query.toggleMeasureAggregateFunction({ nodeDefUuid, aggregateFn })(query))}
            variant={aggregateFunctions.indexOf(aggregateFn) >= 0 ? 'contained' : 'outlined'}
          />
        ))}
      </div>
      <CustomAggregateFunctionsEditor
        entityDef={entityDef}
        nodeDef={nodeDef}
        selectedUuids={customAggregateFunctionUuids}
        onSelectionChange={(selectedAggregateFunctionsByUuid) => {
          Object.keys(selectedAggregateFunctionsByUuid).forEach((uuid) =>
            onChangeQuery(Query.toggleMeasureAggregateFunction({ nodeDefUuid, aggregateFn: uuid })(query))
          )
        }}
      />
    </PanelRight>
  )
}

AggregateFunctionsPanel.propTypes = {
  aggregateFunctions: PropTypes.array.isRequired,
  nodeDef: PropTypes.object.isRequired,
  onChangeQuery: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  query: PropTypes.object.isRequired,
}
