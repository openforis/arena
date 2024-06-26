import React, { useCallback } from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'

import Chip from '@webapp/components/form/chip'
import { useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

export const DataQuerySortableItemChip = (props) => {
  const { nodeDefDef, nodeDefLabelType, onDelete: onDeleteProp } = props

  const i18n = useI18n()
  const lang = useSurveyPreferredLang()

  const nodeDefLabelOrName = NodeDef.getLabelWithType({ nodeDef: nodeDefDef, lang, type: nodeDefLabelType })

  const label = NodeDef.isEntity(nodeDefDef)
    ? i18n.t('dataView.nodeDefsSelector.nodeDefFrequency', {
        nodeDefLabel: nodeDefLabelOrName,
      })
    : nodeDefLabelOrName

  const onDelete = useCallback(() => {
    onDeleteProp(nodeDefDef)
  }, [nodeDefDef, onDeleteProp])

  return (
    <Chip
      key={NodeDef.getUuid(nodeDefDef)}
      className="data-query__sortable-item-chip"
      onDelete={onDelete}
      label={label}
    />
  )
}

DataQuerySortableItemChip.propTypes = {
  nodeDefDef: PropTypes.object.isRequired,
  nodeDefLabelType: PropTypes.string,
  onDelete: PropTypes.func.isRequired,
}
