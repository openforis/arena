import './SystemLogs.scss'

import React, { useCallback, useMemo, useState } from 'react'
import classNames from 'classnames'

import { SystemLogConstants } from '@common/systemLog/systemLogConstants'

import { useI18n } from '@webapp/store/system'
import { Button } from '@webapp/components/buttons'
import Dropdown from '@webapp/components/form/Dropdown'
import { SimpleTextInput } from '@webapp/components/form/SimpleTextInput'

import { allLogLevels, filterLines, LogLevel } from './systemLogLines'
import { useSystemLogStream } from './useSystemLogStream'
import { VirtualizedLogLines } from './VirtualizedLogLines'

const maxLinesOptions = [SystemLogConstants.defaultMaxLines, 5000, SystemLogConstants.maxLinesLimit].map((value) => ({
  value,
  label: value.toLocaleString(),
}))

const SystemLogs = (): React.ReactElement => {
  const i18n = useI18n()
  const [maxLines, setMaxLines] = useState(SystemLogConstants.defaultMaxLines)
  const [paused, setPaused] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [levels, setLevels] = useState<LogLevel[]>(allLogLevels)

  const { instanceId, fileName, fileExists, lines, pendingCount, status, error, clear, reconnect } = useSystemLogStream(
    { maxLines, paused }
  )

  const visibleLines = useMemo(() => filterLines(lines, { text: searchText, levels }), [levels, lines, searchText])

  const toggleLevel = useCallback(
    (level: LogLevel) =>
      setLevels((prevLevels) =>
        prevLevels.includes(level) ? prevLevels.filter((prevLevel) => prevLevel !== level) : [...prevLevels, level]
      ),
    []
  )

  return (
    <div className="system-logs">
      <div className="system-logs__header">
        <h1>{i18n.t('systemLogsView:title')}</h1>
        <div className="system-logs__source">
          {instanceId && <span>{i18n.t('systemLogsView:source', { instanceId, fileName })}</span>}
          <span className={classNames('system-logs__status', status)}>{i18n.t(`systemLogsView:status.${status}`)}</span>
          {error && <span className="system-logs__error">{error}</span>}
        </div>
      </div>

      <div className="system-logs__toolbar">
        <SimpleTextInput
          className="system-logs__search"
          onChange={setSearchText}
          placeholder="systemLogsView:searchPlaceholder"
          value={searchText}
        />
        <div className="system-logs__levels">
          {allLogLevels.map((level) => (
            <Button
              key={level}
              label={`systemLogsView:levels.${level}`}
              onClick={() => toggleLevel(level)}
              size="small"
              variant={levels.includes(level) ? 'contained' : 'outlined'}
            />
          ))}
        </div>
        <div className="system-logs__max-lines">
          <span>{i18n.t('systemLogsView:maxLines')}</span>
          <Dropdown
            clearable={false}
            items={maxLinesOptions}
            onChange={(item) => item && setMaxLines(item.value)}
            searchable={false}
            selection={maxLinesOptions.find((option) => option.value === maxLines)}
          />
        </div>
        <Button
          iconClassName={paused ? 'icon-play3' : 'icon-pause2'}
          label={paused ? 'systemLogsView:resume' : 'systemLogsView:pause'}
          labelParams={{ count: pendingCount }}
          onClick={() => setPaused(!paused)}
          variant="outlined"
        />
        <Button iconClassName="icon-bin2" label="systemLogsView:clear" onClick={clear} variant="outlined" />
        <Button iconClassName="icon-loop2" label="systemLogsView:reconnect" onClick={reconnect} variant="outlined" />
      </div>

      {!fileExists && <div className="system-logs__info">{i18n.t('systemLogsView:fileNotFound', { fileName })}</div>}

      <VirtualizedLogLines lines={visibleLines} />

      <div className="system-logs__footer">
        {i18n.t('systemLogsView:linesCount', { visible: visibleLines.length, total: lines.length })}
      </div>
    </div>
  )
}

export default SystemLogs
