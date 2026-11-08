import { useCallback } from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'

import Chip from '@webapp/components/form/chip'
import { useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

export const DataQuerySortableItemChip = (props) => {
  const { children = null, nodeDefDef, nodeDefLabelType, onDelete: onDeleteProp } = props

  const i18n = useI18n()
  const lang = useSurveyPreferredLang()

  const nodeDefLabelOrName = NodeDef.getLabelWithType({ nodeDef: nodeDefDef, lang, type: nodeDefLabelType })

  const label = NodeDef.isEntity(nodeDefDef)
    ? i18n.t('dataView:nodeDefsSelector.nodeDefFrequency', {
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
      label={
        <>
          {/* drag handle: only the text, not the extra content */}
          <span className="data-query__sortable-item-chip-label">{label}</span>
          {children}
        </>
      }
    />
  )
}

DataQuerySortableItemChip.propTypes = {
  children: PropTypes.node,
  nodeDefDef: PropTypes.object.isRequired,
  nodeDefLabelType: PropTypes.string,
  onDelete: PropTypes.func.isRequired,
}
