import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import Chip from '@mui/material/Chip'

import * as NodeDef from '@core/survey/nodeDef'

import { useSurveyPreferredLang } from '@webapp/store/survey'

export const DataQuerySortableItemChip = (props) => {
  const { attributeDef, nodeDefLabelType, onDelete: onDeleteProp } = props

  const lang = useSurveyPreferredLang()

  const onDelete = useCallback(() => {
    onDeleteProp(attributeDef)
  }, [attributeDef, onDeleteProp])

  return (
    <Chip
      key={NodeDef.getUuid(attributeDef)}
      className="data-query__selected-attribute-chip"
      onDelete={() => onDelete(attributeDef)}
      label={NodeDef.getLabelWithType({ nodeDef: attributeDef, lang, type: nodeDefLabelType })}
      variant="outlined"
    />
  )
}

DataQuerySortableItemChip.propTypes = {
  attributeDef: PropTypes.object.isRequired,
  nodeDefLabelType: PropTypes.string,
  onDelete: PropTypes.func.isRequired,
}
