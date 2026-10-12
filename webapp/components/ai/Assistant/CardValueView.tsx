import React from 'react'

import { useI18nT } from '@webapp/store/system'

import type { CardValue } from './changeSetCardModel'

/**
 * A value of a change set row (text, boolean or expression list).
 * @param {object} props - Props.
 * @param {CardValue} props.value - Value.
 * @returns {React.ReactElement} The value.
 */
export const CardValueView = ({ value }: { value: CardValue }) => {
  const t = useI18nT({ unescapeHtml: true })
  if (value.kind === 'boolean') return <span>{t(value.value ? 'aiAssistant.card.yes' : 'aiAssistant.card.no')}</span>
  if (value.kind === 'text') return <span>{value.text || t('aiAssistant.card.empty')}</span>
  if (value.items.length === 0) return <span>{t('aiAssistant.card.empty')}</span>
  return (
    <ul className="ai-assistant-card__expressions">
      {value.items.map((item, index) => (
        <li key={`${index}-${item.expression}`}>
          <code>{item.expression}</code>
          {item.applyIf && (
            <>
              {' '}
              <span>{t('nodeDefEdit.expressionsProp.applyIf')}</span> <code>{item.applyIf}</code>
            </>
          )}
        </li>
      ))}
    </ul>
  )
}
