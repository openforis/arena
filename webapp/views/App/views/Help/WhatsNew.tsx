import './WhatsNew.scss'

import { WhatsNewCarousel, useWhatsNewVisibleItems } from '@webapp/components/WhatsNew'
import { useI18n } from '@webapp/store/system'

export const WhatsNew = () => {
  const i18n = useI18n()
  const items = useWhatsNewVisibleItems()

  return (
    <div className="whats-new-view">
      <h3>{i18n.t('whatsNew:title')}</h3>
      {items.length === 0 ? <div>{i18n.t('whatsNew:noItems')}</div> : <WhatsNewCarousel items={items} />}
    </div>
  )
}
