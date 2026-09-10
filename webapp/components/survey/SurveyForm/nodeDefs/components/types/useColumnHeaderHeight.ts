import React, { useEffect, useState } from 'react'

type Params = {
  headerRef: React.RefObject<HTMLElement | null>
  enabled: boolean
}

type Result = {
  columnHeaderHeight: number | null
  resizableCellHeight: number | null
}

// Measures the entity table's column header row height, and derives the height to apply to individual
// resizable header cells in the Survey Designer.
//
// In the Designer, each header cell is wrapped in a react-resizable `ResizableBox` whose own box sits
// one level inside `.react-grid-item`, which gets a border only in edit mode (see SurveyForm.scss's
// `.survey-form.edit .react-grid-item` rule). Feeding the header row's raw measured height (border
// included) straight into that inner box double-counts the border every time it's re-applied, which
// made the header grow without bound on every resize tick. Subtracting the actual measured border
// width keeps the correction accurate even though its size differs depending on edit permissions
// (`.survey-form:not(.edit) .react-grid-item` only borders one side), and re-measuring it on every
// tick (rather than once) keeps it correct if those permissions change while the table stays mounted.
export const useColumnHeaderHeight = ({ headerRef, enabled }: Params): Result => {
  const [columnHeaderHeight, setColumnHeaderHeight] = useState<number | null>(null)
  const [headerCellChromeHeight, setHeaderCellChromeHeight] = useState(0)

  useEffect(() => {
    const headerEl = headerRef.current
    if (!enabled || !headerEl) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return

      const sampleCellItem = headerEl.querySelector('.react-grid-item')
      if (sampleCellItem) {
        const computedStyle = window.getComputedStyle(sampleCellItem)
        const verticalBorderWidth =
          Number.parseFloat(computedStyle.borderTopWidth || '0') +
          Number.parseFloat(computedStyle.borderBottomWidth || '0')
        setHeaderCellChromeHeight((prevChrome) =>
          prevChrome === verticalBorderWidth ? prevChrome : verticalBorderWidth
        )
      }

      const measuredHeight = Math.ceil(entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height)
      setColumnHeaderHeight((prevHeight) => (prevHeight === measuredHeight ? prevHeight : measuredHeight))
    })
    observer.observe(headerEl)

    return () => observer.disconnect()
  }, [enabled, headerRef])

  const resizableCellHeight =
    columnHeaderHeight === null ? null : Math.max(0, columnHeaderHeight - headerCellChromeHeight)

  return { columnHeaderHeight, resizableCellHeight }
}
