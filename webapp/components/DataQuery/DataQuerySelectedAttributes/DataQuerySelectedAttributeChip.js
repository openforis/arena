import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import Chip from '@mui/material/Chip'

import { ArrayUtils } from '@core/arrayUtils'
import * as NodeDef from '@core/survey/nodeDef'

import { Query } from '@common/model/query'

import { useSurveyPreferredLang } from '@webapp/store/survey'

export const DataQuerySelectedAttributeChip = (props) => {
  const { attributeDef, nodeDefLabelType, onChangeQuery, query } = props

  const lang = useSurveyPreferredLang()

  const onDelete = useCallback(() => {
    const attributeDefUuids = Query.getAttributeDefUuids(query)
    const attributeDefUuidsUpdated = ArrayUtils.removeItem({ item: NodeDef.getUuid(attributeDef) })(attributeDefUuids)
    onChangeQuery(Query.assocAttributeDefUuids(attributeDefUuidsUpdated)(query))
  }, [attributeDef, onChangeQuery, query])

  return (
    <Chip
      key={NodeDef.getUuid(attributeDef)}
      className="data-query__selected-attribute-chip"
      onDelete={onDelete}
      label={NodeDef.getLabelWithType({ nodeDef: attributeDef, lang, type: nodeDefLabelType })}
      variant="outlined"
    />
  )
}

DataQuerySelectedAttributeChip.propTypes = {
  attributeDef: PropTypes.object.isRequired,
  nodeDefLabelType: PropTypes.string,
  onChangeQuery: PropTypes.func.isRequired,
  query: PropTypes.object.isRequired,
}
