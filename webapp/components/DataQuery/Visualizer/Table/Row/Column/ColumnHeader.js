import React, { useState } from 'react'
import PropTypes from 'prop-types'

import * as A from '@core/arena'
import * as NodeDef from '@core/survey/nodeDef'
import * as StringUtils from '@core/stringUtils'

import { Query } from '@common/model/query'
import { ColumnNodeDef } from '@common/model/db'

import { useI18n } from '@webapp/store/system'
import { useSurveyPreferredLang } from '@webapp/store/survey'

import { ButtonIconGear } from '@webapp/components/buttons/ButtonIconGear'
import NodeDefTableCellHeader from '@webapp/components/survey/SurveyForm/nodeDefs/components/nodeDefTableCellHeader'

import { useColumn } from './store'
import { AggregateFunctionsPanel } from './AggregateFunctionsPanel'

const getFieldByViewColumnName = ({ columnName, nodeDef }) => {
  if (columnName === NodeDef.getName(nodeDef)) {
    if (NodeDef.isTaxon(nodeDef) || NodeDef.isCode(nodeDef)) {
      return 'code'
    }
    if (NodeDef.isCoordinate(nodeDef)) {
      return 'coordinate'
    }
  }
  return ColumnNodeDef.extractColumnName({ nodeDef, columnName })
}

const getColLabelKey = ({ columnName, nodeDef }) => {
  const field = getFieldByViewColumnName({ columnName, nodeDef })
  const fieldCamelized = A.camelize(field)
  const nodeDefTypePrefix = `nodeDef${StringUtils.capitalizeFirstLetter(NodeDef.getType(nodeDef))}`
  return `surveyForm.${nodeDefTypePrefix}.${fieldCamelized}`
}

const ColumnHeader = (props) => {
  const { colWidth, nodeDef, nodeDefLabelType, onChangeQuery, query } = props

  const i18n = useI18n()
  const lang = useSurveyPreferredLang()

  const { modeEdit, columnNames, isMeasure, aggregateFunctions, noCols, widthInner, widthOuter } = useColumn({
    query,
    colWidth,
    nodeDef,
  })

  const entityDefUuid = Query.getEntityDefUuid(query)
  const nodeDefUuid = NodeDef.getUuid(nodeDef)
  const nodeDefLabel = NodeDef.getLabel(nodeDef, lang, nodeDefLabelType)
  // measure is editable only when the node def is not equal to the context entity (e.g. entity count measure is not editable)
  const canEditMeasure = nodeDefUuid !== entityDefUuid

  const [showAggregateFunctionsPanel, setShowAggregateFunctionsPanel] = useState(false)

  return (
    <div className="table__cell" style={{ width: widthOuter }}>
      <div className="table__cell-content-wrapper width100">
        {modeEdit ? (
          <NodeDefTableCellHeader nodeDef={nodeDef} label={nodeDefLabel} lang={lang} />
        ) : (
          <>
            <span className="ellipsis">{nodeDefLabel}</span>
            {isMeasure && canEditMeasure && (
              <ButtonIconGear
                className="btn btn-s btn-transparent btn-aggregates"
                onClick={() => setShowAggregateFunctionsPanel(true)}
                title={i18n.t('common.aggregateFunction', { count: 2 })}
              />
            )}
          </>
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
              ? customAggregateFunction?.name
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
  nodeDefLabelType: PropTypes.string.isRequired,
  onChangeQuery: PropTypes.func.isRequired,
  query: PropTypes.object.isRequired,
}

export default ColumnHeader
