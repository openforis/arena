import React, { useCallback, useLayoutEffect, useRef, useState } from 'react'
import classNames from 'classnames'

import { useI18n } from '@webapp/store/system'
import { Button } from '@webapp/components/buttons'

import { LogLine } from './systemLogLines'

const rowHeight = 18
// rows rendered above and below the visible ones, to avoid blank areas while scrolling fast
const overscanRows = 20

type Props = {
  lines: LogLine[]
}

const LogLineRow = ({ line, top }: { line: LogLine; top: number }) => {
  const i18n = useI18n()
  const { text, level, marker } = line
  return (
    <div
      className={classNames('system-logs__line', { [`level-${level}`]: level, 'system-logs__marker': marker })}
      style={{ top, height: rowHeight, lineHeight: `${rowHeight}px` }}
    >
      {marker ? `— ${i18n.t(`systemLogsView:markers.${marker}`)} —` : text}
    </div>
  )
}

/**
 * Renders only the visible log lines (fixed row height), following the end of the log while scrolled to the bottom.
 * @param {Props} props - The props.
 * @returns {React.ReactElement} - The list.
 */
export const VirtualizedLogLines = ({ lines }: Props): React.ReactElement => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)
  const [following, setFollowing] = useState(true)

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
    setFollowing(scrollHeight - currentScrollTop - clientHeight < rowHeight)
  }, [])

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return undefined
    const resizeObserver = new ResizeObserver(() => setViewportHeight(container.clientHeight))
    resizeObserver.observe(container)
    setViewportHeight(container.clientHeight)
    return () => resizeObserver.disconnect()
  }, [])

  useLayoutEffect(() => {
    if (following) scrollToBottom()
  }, [following, lines, scrollToBottom])

  const firstIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscanRows)
  const lastIndex = Math.min(lines.length, Math.ceil((scrollTop + viewportHeight) / rowHeight) + overscanRows)
  const visibleLines = lines.slice(firstIndex, lastIndex)

  return (
    <div className="system-logs__lines-wrapper">
      <div className="system-logs__lines" ref={containerRef} onScroll={onScroll}>
        <div className="system-logs__lines-content" style={{ height: lines.length * rowHeight }}>
          {visibleLines.map((line, index) => (
            <LogLineRow key={line.id} line={line} top={(firstIndex + index) * rowHeight} />
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
