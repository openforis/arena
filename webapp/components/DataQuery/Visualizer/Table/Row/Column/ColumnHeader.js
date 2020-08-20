import React from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'
import * as StringUtils from '@core/stringUtils'

import { Query } from '@common/model/query'
import { ColumnNodeDef } from '@common/model/db'

import { useI18n } from '@webapp/store/system'
import { useSurveyLang } from '@webapp/store/survey'

import NodeDefTableCellHeader from '@webapp/components/survey/SurveyForm/nodeDefs/components/nodeDefTableCellHeader'

import { useColumn } from './store'

const getColLabelKey = ({ colName, nodeDef }) => {
  const col = ColumnNodeDef.extractColName({ nodeDef, colName })
  const nodeDefTypePrefix = `nodeDef${StringUtils.capitalizeFirstLetter(NodeDef.getType(nodeDef))}`
  return `surveyForm.${nodeDefTypePrefix}.${col}`
}

const ColumnHeader = (props) => {
  const { colWidth, nodeDef, query } = props

  const i18n = useI18n()
  const lang = useSurveyLang()

  const { colNames, isMeasure, modeEdit, noCols, widthInner, widthOuter } = useColumn({
    query,
    colWidth,
    nodeDef,
  })

  return (
    <div className="table__cell" style={{ width: widthOuter }}>
      <div className="width100">
        {modeEdit ? (
          <NodeDefTableCellHeader nodeDef={nodeDef} label={NodeDef.getLabel(nodeDef, lang)} />
        ) : (
          <div>
            {NodeDef.getLabel(nodeDef, lang)}
            {isMeasure && (
              <button type="button" className="btn btn-s btn-transparent btn-aggregates">
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
          {Query.getMeasures(query)
            .get(NodeDef.getUuid(nodeDef))
            .map((aggregateFn) => (
              <div key={`${NodeDef.getUuid(nodeDef)}_${aggregateFn}`} style={{ width: widthInner }}>
                {aggregateFn}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

ColumnHeader.propTypes = {
  colWidth: PropTypes.number.isRequired,
  nodeDef: PropTypes.object.isRequired,
  query: PropTypes.object.isRequired,
}

export default ColumnHeader
