import React from 'react'

import * as NodeDef from '@core/survey/nodeDef'

import { ButtonIconClose } from '@webapp/components/buttons'
import { useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

type Props = {
  children?: React.ReactNode
  index: number
  nodeDef: any
  nodeDefLabelType?: string
  onDelete: (nodeDef: any) => void
}

/**
 * Selected query variable: drag handle, position, label, optional extra content and remove button.
 * @param {Props} props - The component props.
 * @returns {React.ReactElement} - The item element.
 */
export const DataQuerySortableItem = (props: Props) => {
  const { children, index, nodeDef, nodeDefLabelType, onDelete } = props

  const i18n = useI18n()
  const lang = useSurveyPreferredLang()

  const nodeDefLabelOrName = NodeDef.getLabelWithType({ nodeDef, lang, type: nodeDefLabelType })
  const label = NodeDef.isEntity(nodeDef)
    ? i18n.t('dataView:nodeDefsSelector.nodeDefFrequency', { nodeDefLabel: nodeDefLabelOrName })
    : nodeDefLabelOrName

  return (
    <div className="data-query__sortable-item">
      <span
        className="data-query__sortable-item-handle icon icon-menu icon-12px"
        title={i18n.t('dataView:sortableItemsInfo')}
      />
      <span className="data-query__sortable-item-index">{index + 1}</span>
      <span className="data-query__sortable-item-label ellipsis" title={label}>
        {label}
      </span>
      {children}
      <ButtonIconClose
        className="btn-s btn-transparent"
        onClick={() => onDelete(nodeDef)}
        title="dataView:dataQuery.sidebar.remove"
        titleParams={{ name: label }}
      />
    </div>
  )
}
