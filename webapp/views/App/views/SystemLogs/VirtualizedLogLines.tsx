import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import classNames from 'classnames'

import { useI18n } from '@webapp/store/system'
import { Button } from '@webapp/components/buttons'

import { LogLine } from './systemLogLines'

// height of a line not measured yet (rendered on a single row)
const estimatedRowHeight = 18
// rows rendered above and below the visible ones, to avoid blank areas while scrolling fast
const overscanRows = 20

type Props = {
  lines: LogLine[]
  // when specified, every line is prefixed by its instance id, with this color
  instanceColors?: Record<string, string> | null
}

type LogLineRowProps = {
  line: LogLine
  top: number
  instanceColor?: string
  rowsObserver: ResizeObserver
}

const LogLineRow = ({ line, top, instanceColor, rowsObserver }: LogLineRowProps) => {
  const i18n = useI18n()
  const rowRef = useRef<HTMLDivElement>(null)
  const { id, instanceId, text, level, marker } = line

  useLayoutEffect(() => {
    const row = rowRef.current
    if (!row) return undefined
    rowsObserver.observe(row)
    return () => rowsObserver.unobserve(row)
  }, [rowsObserver])

  return (
    <div
      ref={rowRef}
      data-line-id={id}
      className={classNames('system-logs__line', { [`level-${level}`]: level, 'system-logs__marker': marker })}
      style={{ top }}
    >
      {instanceColor && (
        <span className="system-logs__line-instance" style={{ color: instanceColor }}>
          {instanceId}
        </span>
      )}
      {marker ? `— ${i18n.t(`systemLogsView:markers.${marker}`)} —` : text}
    </div>
  )
}

type LinesLayout = {
  // top offset of every line; the last element is the total height
  offsets: number[]
}

const computeLayout = (lines: LogLine[], heightById: Map<number, number>): LinesLayout => {
  const offsets = new Array<number>(lines.length + 1)
  offsets[0] = 0
  for (let index = 0; index < lines.length; index += 1) {
    offsets[index + 1] = offsets[index] + (heightById.get(lines[index].id) ?? estimatedRowHeight)
  }
  return { offsets }
}

// index of the line containing the specified vertical position
const findLineIndexAt = (offsets: number[], position: number): number => {
  let low = 0
  let high = offsets.length - 2
  while (low < high) {
    const middle = Math.ceil((low + high) / 2)
    if (offsets[middle] <= position) low = middle
    else high = middle - 1
  }
  return Math.max(0, low)
}

// measured heights kept at most (the oldest ones are discarded first)
const maxMeasuredHeights = 50000

type HeightById = Map<number, number>

const measureRows = (entries: ResizeObserverEntry[]): [number, number][] =>
  entries
    .map((entry): [number, number] => {
      const element = entry.target as HTMLElement
      return [Number(element.dataset.lineId), element.offsetHeight]
    })
    .filter(([, height]) => height > 0)

const assocHeights =
  (measuredHeights: [number, number][]) =>
  (heightById: HeightById): HeightById => {
    const changedHeights = measuredHeights.filter(([id, height]) => heightById.get(id) !== height)
    if (changedHeights.length === 0) return heightById
    const heightByIdUpdated = new Map(heightById)
    for (const [id, height] of changedHeights) {
      heightByIdUpdated.set(id, height)
    }
    // Map keeps the insertion order: the first keys belong to the oldest measured lines
    for (const id of heightByIdUpdated.keys()) {
      if (heightByIdUpdated.size <= maxMeasuredHeights) break
      heightByIdUpdated.delete(id)
    }
    return heightByIdUpdated
  }

/**
 * Keeps track of the measured height of the rendered lines (they can wrap on several rows).
 * @returns {object} - The measured heights, the observer measuring the rows and a function to reset the heights.
 */
const useRowHeights = () => {
  const [heightById, setHeightById] = useState<HeightById>(() => new Map())

  const [rowsObserver] = useState(
    () => new ResizeObserver((entries) => setHeightById(assocHeights(measureRows(entries))))
  )

  useEffect(() => () => rowsObserver.disconnect(), [rowsObserver])

  // lines wrap differently with a different width: measure them again
  const resetHeights = useCallback(() => setHeightById(new Map()), [])

  return { heightById, rowsObserver, resetHeights }
}

/**
 * Renders only the visible log lines, following the end of the log while scrolled to the bottom.
 * Long lines wrap: the height of the rendered lines is measured.
 * @param {Props} props - The props.
 * @returns {React.ReactElement} - The list.
 */
export const VirtualizedLogLines = ({ lines, instanceColors = null }: Props): React.ReactElement => {
  const containerRef = useRef<HTMLDivElement>(null)
  const containerWidthRef = useRef(0)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)
  const [following, setFollowing] = useState(true)

  const { heightById, rowsObserver, resetHeights } = useRowHeights()

  const { offsets } = useMemo(() => computeLayout(lines, heightById), [lines, heightById])
  const totalHeight = offsets[lines.length]

  const scrollToBottom = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    container.scrollTop = container.scrollHeight
    // update the rendered rows now, without waiting for the scroll event
    setScrollTop(container.scrollTop)
    setFollowing(true)
  }, [])

  const onScroll = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const { scrollTop: currentScrollTop, scrollHeight, clientHeight } = container
    setScrollTop(currentScrollTop)
    setFollowing(scrollHeight - currentScrollTop - clientHeight < estimatedRowHeight)
  }, [])

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return undefined
    const onResize = () => {
      setViewportHeight(container.clientHeight)
      if (container.clientWidth !== containerWidthRef.current) {
        containerWidthRef.current = container.clientWidth
        resetHeights()
      }
    }
    const resizeObserver = new ResizeObserver(onResize)
    resizeObserver.observe(container)
    onResize()
    return () => resizeObserver.disconnect()
  }, [resetHeights])

  useLayoutEffect(() => {
    if (following) scrollToBottom()
  }, [following, totalHeight, scrollToBottom])

  const firstIndex = Math.max(0, findLineIndexAt(offsets, scrollTop) - overscanRows)
  const lastIndex = Math.min(lines.length, findLineIndexAt(offsets, scrollTop + viewportHeight) + 1 + overscanRows)
  const visibleLines = lines.slice(firstIndex, lastIndex)

  return (
    <div className="system-logs__lines-wrapper">
      <div className="system-logs__lines" ref={containerRef} onScroll={onScroll}>
        <div className="system-logs__lines-content" style={{ height: totalHeight }}>
          {visibleLines.map((line, index) => (
            <LogLineRow
              key={line.id}
              line={line}
              top={offsets[firstIndex + index]}
              instanceColor={instanceColors?.[line.instanceId]}
              rowsObserver={rowsObserver}
            />
          ))}
        </div>
      </div>
      {!following && (
        <Button
          className="system-logs__jump-to-latest"
          iconClassName="icon-arrow-down2"
          label="systemLogsView:jumpToLatest"
          onClick={scrollToBottom}
          size="small"
        />
      )}
    </div>
  )
}
