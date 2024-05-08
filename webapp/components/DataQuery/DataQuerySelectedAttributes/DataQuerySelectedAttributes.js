import './DataQuerySelectedAttributes.scss'

import React, { useCallback, useRef } from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'

import { Query } from '@common/model/query'

import { FormItem } from '@webapp/components/form/Input'
import { useSortable } from '@webapp/components/hooks'

import { DataExplorerHooks, DataExplorerSelectors } from '@webapp/store/dataExplorer'
import { useNodeDefsByUuids } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

import { DataQuerySelectedAttributeChip } from './DataQuerySelectedAttributeChip'

export const DataQuerySelectedAttributes = (props) => {
  const { nodeDefLabelType } = props

  const i18n = useI18n()
  const containerRef = useRef(null)
  const query = DataExplorerSelectors.useQuery()
  const onChangeQuery = DataExplorerHooks.useSetQuery()
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
    handleClassName: '.data-query__selected-attribute-chip .MuiChip-label',
    items: queryAttributeDefs,
    onItemsSort: onAttributeDefsSort,
  })

  if (queryAttributeDefs.length === 0) return null

  return (
    <FormItem
      className="data-query__selected-attributes-form-item"
      info="dataView.selectedAttributes.info"
      label={i18n.t('dataView.selectedAttributes.label')}
    >
      <div className="data-query__selected-attributes-wrapper" ref={containerRef}>
        {queryAttributeDefs.map((attributeDef) => (
          <DataQuerySelectedAttributeChip
            key={NodeDef.getUuid(attributeDef)}
            attributeDef={attributeDef}
            nodeDefLabelType={nodeDefLabelType}
            onChangeQuery={onChangeQuery}
            query={query}
          />
        ))}
      </div>
    </FormItem>
  )
}

DataQuerySelectedAttributes.propTypes = {
  nodeDefLabelType: PropTypes.string,
}
