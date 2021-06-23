import React, { useState } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import * as NodeDef from '@core/survey/nodeDef'
import * as StringUtils from '@core/stringUtils'

import { Query } from '@common/model/query'
import { ColumnNodeDef } from '@common/model/db'

import { useI18n } from '@webapp/store/system'
import { useSurveyLang } from '@webapp/store/survey'

import NodeDefTableCellHeader from '@webapp/components/survey/SurveyForm/nodeDefs/components/nodeDefTableCellHeader'
import PanelRight from '@webapp/components/PanelRight'

import { useColumn } from './store'
import { CustomAggregateFunctionsEditor } from './CustomAggregateFunctionsEditor/CustomAggregateFunctionsEditor'

const getColLabelKey = ({ columnName, nodeDef }) => {
  const col = ColumnNodeDef.extractColumnName({ nodeDef, columnName })
  const nodeDefTypePrefix = `nodeDef${StringUtils.capitalizeFirstLetter(NodeDef.getType(nodeDef))}`
  return `surveyForm.${nodeDefTypePrefix}.${col}`
}

const ColumnHeader = (props) => {
  const { colWidth, nodeDef, onChangeQuery, query } = props

  const i18n = useI18n()
  const lang = useSurveyLang()

  const {
    modeEdit,
    columnNames,
    isMeasure,
    aggregateFunctions,
    customAggregateFunction,
    customAggregateFunctionUuids,
    noCols,
    widthInner,
    widthOuter,
  } = useColumn({
    query,
    colWidth,
    nodeDef,
  })

  const nodeDefUuid = NodeDef.getUuid(nodeDef)
  const nodeDefLabel = NodeDef.getLabel(nodeDef, lang)

  const [showAggregateFunctionsPanel, setShowAggregateFunctionsPanel] = useState(false)

  return (
    <div className="table__cell" style={{ width: widthOuter }}>
      <div className="width100">
        {modeEdit ? (
          <NodeDefTableCellHeader nodeDef={nodeDef} label={nodeDefLabel} />
        ) : (
          <div>
            {nodeDefLabel}
            {isMeasure && !customAggregateFunction && (
              <button
                type="button"
                className="btn btn-s btn-transparent btn-aggregates"
                onClick={() => setShowAggregateFunctionsPanel(true)}
              >
                <span className="icon icon-cog icon-14px" />
              </button>
            )}
          </div>
        )}
      </div>

      {noCols > 1 && !modeEdit && !isMeasure && (
        <div className="table__inner-cell">
          {columnNames.map((columnName) => (
            <div key={columnName} style={{ width: widthInner }}>
              {i18n.t(getColLabelKey({ columnName, nodeDef }))}
            </div>
          ))}
        </div>
      )}
      {isMeasure && (
        <div className="table__inner-cell">
          {customAggregateFunction ? (
            <div key={`${nodeDefUuid}_agg_fn`} style={{ width: widthInner }}>
              {customAggregateFunction}
            </div>
          ) : (
            aggregateFunctions.map((aggregateFn) => (
              <div key={`${nodeDefUuid}_${aggregateFn}`} style={{ width: widthInner }}>
                {i18n.t(`common.${aggregateFn}`)}
              </div>
            ))
          )}
        </div>
      )}

      {showAggregateFunctionsPanel && (
        <PanelRight
          width="700px"
          header={`${nodeDefLabel} ${i18n.t('common.aggregateFunction', { count: 2 })}`}
          onClose={() => setShowAggregateFunctionsPanel(false)}
        >
          {Object.keys(Query.DEFAULT_AGGREGATE_FUNCTIONS).map((aggregateFn) => (
            <button
              key={aggregateFn}
              type="button"
              className={classNames('btn btn-aggregate-fn deselectable', {
                active: aggregateFunctions.indexOf(aggregateFn) >= 0,
              })}
              onClick={() => onChangeQuery(Query.toggleMeasureAggregateFunction({ nodeDefUuid, aggregateFn })(query))}
            >
              {i18n.t(`common.${aggregateFn}`)}
            </button>
          ))}
          <CustomAggregateFunctionsEditor
            nodeDef={nodeDef}
            selectedUuids={customAggregateFunctionUuids}
            onSelectionChange={(selectedAggregateFunctionsByUuid) => {
              Object.keys(selectedAggregateFunctionsByUuid).forEach((uuid) =>
                onChangeQuery(Query.toggleMeasureAggregateFunction({ nodeDefUuid, aggregateFn: uuid })(query))
              )
            }}
          />
        </PanelRight>
      )}
    </div>
  )
}

ColumnHeader.propTypes = {
  colWidth: PropTypes.number.isRequired,
  nodeDef: PropTypes.object.isRequired,
  onChangeQuery: PropTypes.func.isRequired,
  query: PropTypes.object.isRequired,
}

export default ColumnHeader
