import './SystemLogs.scss'

import React, { useCallback, useMemo, useState } from 'react'
import classNames from 'classnames'

import { SystemLogConstants } from '@common/systemLog/systemLogConstants'
import * as DateUtils from '@core/dateUtils'

import { useI18n } from '@webapp/store/system'
import { Button } from '@webapp/components/buttons'
import Dropdown from '@webapp/components/form/Dropdown'
import { SimpleTextInput } from '@webapp/components/form/SimpleTextInput'
import { downloadTextToFile } from '@webapp/utils/domUtils'

import { allLogLevels, filterLines, formatLinesAsText, LogLevel, LogMarker } from './systemLogLines'
import { SystemLogInstance, useSystemLogStream } from './useSystemLogStream'
import { VirtualizedLogLines } from './VirtualizedLogLines'

const maxLinesOptions = [SystemLogConstants.defaultMaxLines, 5000, SystemLogConstants.maxLinesLimit].map((value) => ({
  value,
  label: value.toLocaleString(),
}))

// readable on the dark background of the log lines
const instanceColorsPalette = ['#56d4dd', '#d2a8ff', '#7ee787', '#ffa657', '#f778ba', '#a5d6ff', '#e3b341', '#ff7b72']

const toggleItem = <T,>(items: T[], item: T): T[] =>
  items.includes(item) ? items.filter((existingItem) => existingItem !== item) : [...items, item]

type InstancesSelectorProps = {
  instances: SystemLogInstance[]
  instanceColors: Record<string, string>
  excludedInstanceIds: string[]
  onToggle: (instanceId: string) => void
}

const InstancesSelector = ({ instances, instanceColors, excludedInstanceIds, onToggle }: InstancesSelectorProps) => {
  const i18n = useI18n()
  return (
    <div className="system-logs__instances">
      <span>{i18n.t('systemLogsView:instances')}</span>
      {instances.map(({ instanceId, local, lost }) => (
        <Button
          key={instanceId}
          className={classNames('system-logs__instance', { lost })}
          iconClassName="icon-display"
          iconEnd={
            <span className="system-logs__instance-color" style={{ backgroundColor: instanceColors[instanceId] }} />
          }
          label={local ? i18n.t('systemLogsView:localInstance', { instanceId }) : instanceId}
          labelIsI18nKey={false}
          onClick={() => onToggle(instanceId)}
          size="small"
          title={lost ? 'systemLogsView:instanceLost' : undefined}
          variant={excludedInstanceIds.includes(instanceId) ? 'outlined' : 'contained'}
        />
      ))}
    </div>
  )
}

const SystemLogs = (): React.ReactElement => {
  const i18n = useI18n()
  const [maxLines, setMaxLines] = useState(SystemLogConstants.defaultMaxLines)
  const [paused, setPaused] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [levels, setLevels] = useState<LogLevel[]>(allLogLevels)
  const [showHttpRequests, setShowHttpRequests] = useState(true)
  // new instances are included by default: keep track of the excluded ones
  const [excludedInstanceIds, setExcludedInstanceIds] = useState<string[]>([])

  const { instances, lines, pendingCount, status, error, clear, reconnect } = useSystemLogStream({ maxLines, paused })

  const localInstance = instances.find((instance) => instance.local)
  const missingFileInstances = instances.filter((instance) => !instance.fileExists)

  const instanceColors = useMemo(
    () =>
      Object.fromEntries(
        instances.map(({ instanceId }, index) => [
          instanceId,
          instanceColorsPalette[index % instanceColorsPalette.length],
        ])
      ),
    [instances]
  )

  const visibleLines = useMemo(
    () => filterLines(lines, { text: searchText, levels, excludedInstanceIds, hideHttpRequests: !showHttpRequests }),
    [excludedInstanceIds, levels, lines, searchText, showHttpRequests]
  )

  const multipleInstances = instances.length > 1

  // exports all the loaded lines, ignoring the filters
  const exportLines = useCallback(() => {
    const text = formatLinesAsText(lines, {
      formatMarker: (marker: LogMarker) => `— ${i18n.t(`systemLogsView:markers.${marker}`)} —`,
      includeInstanceId: multipleInstances,
    })
    const timestamp = DateUtils.formatDateTimeExport(new Date()).replaceAll(/[ :]/g, '-')
    downloadTextToFile(text, `arena_logs_${timestamp}.log`)
  }, [i18n, lines, multipleInstances])

  const toggleLevel = useCallback((level: LogLevel) => setLevels((prev) => toggleItem(prev, level)), [])
  const toggleInstance = useCallback(
    (instanceId: string) => setExcludedInstanceIds((prev) => toggleItem(prev, instanceId)),
    []
  )

  return (
    <div className="system-logs">
      <div className="system-logs__header">
        <h1>{i18n.t('systemLogsView:title')}</h1>
        <div className="system-logs__source">
          {localInstance && (
            <span>
              {i18n.t('systemLogsView:source', {
                instanceId: localInstance.instanceId,
                fileName: localInstance.fileName,
              })}
            </span>
          )}
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
        <Button
          label="systemLogsView:httpRequests"
          onClick={() => setShowHttpRequests(!showHttpRequests)}
          size="small"
          title="systemLogsView:httpRequestsTitle"
          variant={showHttpRequests ? 'contained' : 'outlined'}
        />
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
        <Button
          disabled={lines.length === 0}
          iconClassName="icon-download2"
          label="systemLogsView:export"
          onClick={exportLines}
          title="systemLogsView:exportTitle"
          variant="outlined"
        />
        <Button iconClassName="icon-bin2" label="systemLogsView:clear" onClick={clear} variant="outlined" />
        <Button iconClassName="icon-loop2" label="systemLogsView:reconnect" onClick={reconnect} variant="outlined" />
      </div>

      {instances.length > 0 && (
        <InstancesSelector
          instances={instances}
          instanceColors={instanceColors}
          excludedInstanceIds={excludedInstanceIds}
          onToggle={toggleInstance}
        />
      )}

      {missingFileInstances.map(({ instanceId, fileName }) => (
        <div key={instanceId} className="system-logs__info">
          {i18n.t('systemLogsView:fileNotFound', { instanceId, fileName })}
        </div>
      ))}

      <VirtualizedLogLines lines={visibleLines} instanceColors={multipleInstances ? instanceColors : null} />

      <div className="system-logs__footer">
        {i18n.t('systemLogsView:linesCount', { visible: visibleLines.length, total: lines.length })}
      </div>
    </div>
  )
}

export default SystemLogs
