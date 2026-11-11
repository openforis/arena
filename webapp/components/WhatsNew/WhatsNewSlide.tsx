import { useCallback } from 'react'

import * as WhatsNew from '@core/whatsNew/whatsNew'

import { useI18n } from '@webapp/store/system'

import { Carousel } from '../Carousel'
import Markdown from '../markdown'

type WhatsNewSlideProps = {
  item: WhatsNew.WhatsNewItem
}

export const WhatsNewSlide = (props: WhatsNewSlideProps) => {
  const { item } = props

  const i18n = useI18n()

  const title = i18n.t(WhatsNew.getTitleKey(item))
  const images = item.images ?? []

  const renderImage = useCallback(
    (image: string, index: number) => (
      <img
        alt={images.length > 1 ? `${title} (${index + 1}/${images.length})` : title}
        className="whats-new-slide__image"
        src={image}
      />
    ),
    [images.length, title]
  )

  return (
    <div className="whats-new-slide">
      {images.length > 0 && (
        <div className="whats-new-slide__image-container">
          <Carousel
            className="whats-new-slide__images-carousel"
            items={images}
            renderItem={renderImage}
            showButtonLabels={false}
          />
        </div>
      )}
      <div className="whats-new-slide__header">
        <span className="whats-new-slide__title">{title}</span>
        {item.experimental && (
          <span className="whats-new-slide__experimental-badge">{i18n.t('whatsNew:experimental')}</span>
        )}
      </div>
      <Markdown
        className="whats-new-slide__description"
        openLinksInNewTab
        source={i18n.t(WhatsNew.getDescriptionKey(item))}
      />
      <span className="whats-new-slide__version">{i18n.t('whatsNew:since', { version: item.version })}</span>
    </div>
  )
}
