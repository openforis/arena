import React, { useState } from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'
import * as StringUtils from '@core/stringUtils'

import { Query } from '@common/model/query'
import { ColumnNodeDef } from '@common/model/db'

import { useI18n } from '@webapp/store/system'
import { useSurveyLang } from '@webapp/store/survey'

import NodeDefTableCellHeader from '@webapp/components/survey/SurveyForm/nodeDefs/components/nodeDefTableCellHeader'

import { useColumn } from './store'
import { AggregateFunctionsPanel } from './AggregateFunctionsPanel'

const getColLabelKey = ({ columnName, nodeDef }) => {
  const col = ColumnNodeDef.extractColumnName({ nodeDef, columnName })
  const nodeDefTypePrefix = `nodeDef${StringUtils.capitalizeFirstLetter(NodeDef.getType(nodeDef))}`
  return `surveyForm.${nodeDefTypePrefix}.${col}`
}

const ColumnHeader = (props) => {
  const { colWidth, nodeDef, onChangeQuery, query } = props

  const i18n = useI18n()
  const lang = useSurveyLang()

  const { modeEdit, columnNames, isMeasure, aggregateFunctions, noCols, widthInner, widthOuter } = useColumn({
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
            {isMeasure && (
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
          {aggregateFunctions.map((aggregateFn) => {
            const isCustomAggregateFunction = !Object.values(Query.DEFAULT_AGGREGATE_FUNCTIONS).includes(aggregateFn)
            const customAggregateFunction = isCustomAggregateFunction
              ? NodeDef.getAggregateFunctionByUuid(aggregateFn)(nodeDef)
              : null
            const aggregateFunctionLabel = isCustomAggregateFunction
              ? customAggregateFunction.name
              : i18n.t(`common.${aggregateFn}`)
            return (
              <div key={`${nodeDefUuid}_${aggregateFn}`} style={{ width: widthInner }}>
                {aggregateFunctionLabel}
              </div>
            )
          })}
        </div>
      )}

      {showAggregateFunctionsPanel && (
        <AggregateFunctionsPanel
          nodeDef={nodeDef}
          aggregateFunctions={aggregateFunctions}
          onChangeQuery={onChangeQuery}
          onClose={() => setShowAggregateFunctionsPanel(false)}
          query={query}
        />
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
