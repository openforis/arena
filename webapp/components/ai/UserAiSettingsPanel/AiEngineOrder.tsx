import React, { useId } from 'react'

import { RadioButtonGroup as RadioButtonGroupJS } from '@webapp/components/RadioButtonGroup'
import { useI18n } from '@webapp/store/system'

// JS component: cast to restore usability in TS (same as the other panel components)
const RadioButtonGroup = RadioButtonGroupJS as React.ComponentType<any>

const LOCAL_FIRST = 'localFirst'
const CLOUD_FIRST = 'cloudFirst'

const ORDER_ITEMS = [
  { key: LOCAL_FIRST, label: 'userAiSettings:where.order.localFirst' },
  { key: CLOUD_FIRST, label: 'userAiSettings:where.order.cloudFirst' },
]

type Props = {
  preferLocal: boolean
  onChange: (preferLocal: boolean) => void
}

/**
 * Order between the local server and the cloud provider (the local `preferLocal` setting).
 * @param {Props} props - Props.
 * @returns {React.ReactElement} The radio group with its hint.
 */
export const AiEngineOrder = ({ preferLocal, onChange }: Props) => {
  const i18n = useI18n()
  const titleId = useId()
  return (
    <div className="user-ai-settings-panel__order">
      <div id={titleId} className="user-ai-settings-panel__order-title">
        {i18n.t('userAiSettings:where.order.title')}
      </div>
      <RadioButtonGroup
        ariaLabelledBy={titleId}
        items={ORDER_ITEMS}
        value={preferLocal ? LOCAL_FIRST : CLOUD_FIRST}
        onChange={(value: string) => onChange(value === LOCAL_FIRST)}
      />
      <div className="user-ai-settings-panel__hint">{i18n.t('userAiSettings:where.order.hint')}</div>
    </div>
  )
}
