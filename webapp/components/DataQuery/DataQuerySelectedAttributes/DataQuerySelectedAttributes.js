import './DataQuerySelectedAttributes.scss'

import React, { useCallback, useRef } from 'react'
import PropTypes from 'prop-types'
import Chip from '@mui/material/Chip'

import * as NodeDef from '@core/survey/nodeDef'
import { Query } from '@common/model/query'
import { useNodeDefsByUuids, useSurveyPreferredLang } from '@webapp/store/survey'
import { useSortable } from './useSortable'

export const DataQuerySelectedAttributes = (props) => {
  const { nodeDefLabelType, onChangeQuery, query } = props

  const containerRef = useRef(null)
  const lang = useSurveyPreferredLang()
  const queryAttributeDefs = useNodeDefsByUuids(Query.getAttributeDefUuids(query))

  const onAttributeDefsSort = useCallback(
    (sortedAttributeDefs) => {
      onChangeQuery(Query.assocAttributeDefUuids(sortedAttributeDefs.map(NodeDef.getUuid))(query))
    },
    [onChangeQuery, query]
  )

  useSortable({
    containerRef,
    draggableClassName: '.data-query__selected-attribute-chip',
    handleClassName: '.data-query__selected-attribute-chip',
    items: queryAttributeDefs,
    onItemsSort: onAttributeDefsSort,
  })

  return (
    <div className="data-query__selected-attributes" ref={containerRef}>
      {queryAttributeDefs.map((attributeDef) => (
        <Chip
          key={NodeDef.getUuid(attributeDef)}
          className="data-query__selected-attribute-chip"
          label={NodeDef.getLabelWithType({ nodeDef: attributeDef, lang, type: nodeDefLabelType })}
          variant="outlined"
        />
      ))}
    </div>
  )
}

DataQuerySelectedAttributes.propTypes = {
  nodeDefLabelType: PropTypes.string,
  onChangeQuery: PropTypes.func.isRequired,
  query: PropTypes.object.isRequired,
}
