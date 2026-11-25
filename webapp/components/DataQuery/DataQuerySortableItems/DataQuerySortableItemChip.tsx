import { type ReactNode, useCallback } from 'react'

import type { ArenaAnyNodeDef } from '@openforis/arena-core'

import * as NodeDef from '@core/survey/nodeDef'
import Chip from '@webapp/components/form/Chip'
import { useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

type DataQuerySortableItemChipProps = {
  children?: ReactNode
  nodeDefDef: ArenaAnyNodeDef
  nodeDefLabelType?: NodeDef.NodeDefLabelType
  onDelete: (...args: any[]) => any
}

export const DataQuerySortableItemChip = (props: DataQuerySortableItemChipProps) => {
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
