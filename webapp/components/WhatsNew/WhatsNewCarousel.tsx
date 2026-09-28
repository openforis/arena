import './WhatsNew.scss'

import { useCallback } from 'react'

import * as WhatsNew from '@core/whatsNew/whatsNew'

import { Carousel } from '../Carousel'
import { WhatsNewSlide } from './WhatsNewSlide'

type WhatsNewCarouselProps = {
  items: WhatsNew.WhatsNewItem[]
}

export const WhatsNewCarousel = (props: WhatsNewCarouselProps) => {
  const { items } = props

  const renderItem = useCallback((item: WhatsNew.WhatsNewItem) => <WhatsNewSlide key={item.id} item={item} />, [])

  return <Carousel className="whats-new-carousel" items={items} renderItem={renderItem} />
}
