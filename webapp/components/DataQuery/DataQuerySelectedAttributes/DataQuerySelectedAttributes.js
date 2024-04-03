import './DataQuerySelectedAttributes.scss'

import React, { useCallback, useRef } from 'react'
import PropTypes from 'prop-types'
import Chip from '@mui/material/Chip'

import * as NodeDef from '@core/survey/nodeDef'
import { Query } from '@common/model/query'
import { useNodeDefsByUuids, useSurveyPreferredLang } from '@webapp/store/survey'
import { useSortable } from './useSortable'
import { FormItem } from '@webapp/components/form/Input'
import { useI18n } from '@webapp/store/system'

export const DataQuerySelectedAttributes = (props) => {
  const { nodeDefLabelType, onChangeQuery, query } = props

  const i18n = useI18n()
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

  if (queryAttributeDefs.length === 0) return null

  return (
    <FormItem
      className="data-query__selected-attributes-form-item"
      info={i18n.t('dataView.selectedAttributes.info')}
      label={i18n.t('dataView.selectedAttributes.label')}
    >
      <div className="data-query__selected-attributes-wrapper" ref={containerRef}>
        {queryAttributeDefs.map((attributeDef) => (
          <Chip
            key={NodeDef.getUuid(attributeDef)}
            className="data-query__selected-attribute-chip"
            label={NodeDef.getLabelWithType({ nodeDef: attributeDef, lang, type: nodeDefLabelType })}
            variant="outlined"
          />
        ))}
      </div>
    </FormItem>
  )
}

DataQuerySelectedAttributes.propTypes = {
  nodeDefLabelType: PropTypes.string,
  onChangeQuery: PropTypes.func.isRequired,
  query: PropTypes.object.isRequired,
}
