import './Carousel.scss'

import React, { useCallback, useState } from 'react'
import classNames from 'classnames'
import MobileStepper from '@mui/material/MobileStepper'

import { ButtonNext, ButtonPrevious } from '../buttons'

type CarouselProps<T> = {
  className?: string
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
}

export const Carousel = <T,>(props: CarouselProps<T>) => {
  const { className, items, renderItem } = props

  const [activeIndexState, setActiveIndex] = useState(0)
  const count = items.length
  const lastIndex = Math.max(0, count - 1)
  // keep the active index in range when the items change
  const activeIndex = Math.min(activeIndexState, lastIndex)

  const goToPrevious = useCallback(() => setActiveIndex(Math.max(0, activeIndex - 1)), [activeIndex])
  const goToNext = useCallback(() => setActiveIndex(Math.min(lastIndex, activeIndex + 1)), [activeIndex, lastIndex])

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        goToPrevious()
      } else if (event.key === 'ArrowRight') {
        goToNext()
      }
    },
    [goToNext, goToPrevious]
  )

  if (count === 0) return null

  const activeItem = items[activeIndex]

  return (
    <div className={classNames('carousel', className)} onKeyDown={onKeyDown} tabIndex={0}>
      <div className="carousel__item">{renderItem(activeItem, activeIndex)}</div>
      {count > 1 && (
        <MobileStepper
          activeStep={activeIndex}
          backButton={
            <ButtonPrevious disabled={activeIndex === 0} onClick={goToPrevious} size="small" variant="text" />
          }
          className="carousel__stepper"
          nextButton={
            <ButtonNext disabled={activeIndex === lastIndex} onClick={goToNext} size="small" variant="text" />
          }
          position="static"
          steps={count}
          variant="dots"
        />
      )}
    </div>
  )
}
