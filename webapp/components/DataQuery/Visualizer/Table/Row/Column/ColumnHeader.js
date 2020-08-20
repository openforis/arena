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

const getColLabelKey = ({ colName, nodeDef }) => {
  const col = ColumnNodeDef.extractColName({ nodeDef, colName })
  const nodeDefTypePrefix = `nodeDef${StringUtils.capitalizeFirstLetter(NodeDef.getType(nodeDef))}`
  return `surveyForm.${nodeDefTypePrefix}.${col}`
}

const ColumnHeader = (props) => {
  const { colWidth, nodeDef, onChangeQuery, query } = props

  const i18n = useI18n()
  const lang = useSurveyLang()

  const { modeEdit, colNames, isMeasure, aggregateFunctions, noCols, widthInner, widthOuter } = useColumn({
    query,
    colWidth,
    nodeDef,
  })

  const nodeDefUuid = NodeDef.getUuid(nodeDef)

  const [showAggregateFunctionsPanel, setShowAggregateFunctionsPanel] = useState(false)

  return (
    <div className="table__cell" style={{ width: widthOuter }}>
      <div className="width100">
        {modeEdit ? (
          <NodeDefTableCellHeader nodeDef={nodeDef} label={NodeDef.getLabel(nodeDef, lang)} />
        ) : (
          <div>
            {NodeDef.getLabel(nodeDef, lang)}
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

      {noCols > 1 && !modeEdit && (
        <div className="table__inner-cell">
          {colNames.map((colName) => (
            <div key={colName} style={{ width: widthInner }}>
              {i18n.t(getColLabelKey({ colName, nodeDef }))}
            </div>
          ))}
        </div>
      )}
      {isMeasure && (
        <div className="table__inner-cell">
          {aggregateFunctions.map((aggregateFn) => (
            <div key={`${nodeDefUuid}_${aggregateFn}`} style={{ width: widthInner }}>
              {aggregateFn}
            </div>
          ))}
        </div>
      )}

      {showAggregateFunctionsPanel && (
        <PanelRight onClose={() => setShowAggregateFunctionsPanel(false)}>
          {Object.keys(Query.aggregateFunctions).map((aggregateFunction) => {
            const active = aggregateFunctions.indexOf(aggregateFunction) >= 0

            return (
              <button
                key={aggregateFunction}
                type="button"
                className={classNames('btn btn-aggregate-fn deselectable', { active })}
                onClick={() =>
                  onChangeQuery(Query.toggleMeasureAggregateFunction({ nodeDefUuid, aggregateFunction })(query))
                }
              >
                {i18n.t(`common.${aggregateFunction}`)}
              </button>
            )
          })}
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
