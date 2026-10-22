import * as WhatsNew from '@core/whatsNew/whatsNew'

import { useI18n } from '@webapp/store/system'

import Markdown from '../markdown'

type WhatsNewSlideProps = {
  item: WhatsNew.WhatsNewItem
}

export const WhatsNewSlide = (props: WhatsNewSlideProps) => {
  const { item } = props

  const i18n = useI18n()

  const title = i18n.t(WhatsNew.getTitleKey(item))

  return (
    <div className="whats-new-slide">
      <div className="whats-new-slide__header">
        <span className="whats-new-slide__title">{title}</span>
        {item.experimental && (
          <span className="whats-new-slide__experimental-badge">{i18n.t('whatsNew:experimental')}</span>
        )}
      </div>
      {item.image && <img alt={title} className="whats-new-slide__image" src={item.image} />}
      <Markdown className="whats-new-slide__description" source={i18n.t(WhatsNew.getDescriptionKey(item))} />
      <span className="whats-new-slide__version">{i18n.t('whatsNew:since', { version: item.version })}</span>
    </div>
  )
}
