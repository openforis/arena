import './SurveyCompare.scss'

import { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'

import * as JobSerialized from '@common/job/jobSerialized'
import { SurveyCompareMaxFileSizeMB, SurveyCompareResult } from '@core/survey/surveyCompare/surveyCompareTypes'

import * as API from '@webapp/service/api'
import { Dropzone } from '@webapp/components'
import { Button } from '@webapp/components/buttons'
import { Checkbox } from '@webapp/components/form'
import { Tabs } from '@webapp/components/Tabs'
import { useConfirm } from '@webapp/components/hooks'
import { JobActions } from '@webapp/store/app'
import { SurveyActions, useSurveyId } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { NotificationActions } from '@webapp/store/ui'
import { useAuthCanEditSurvey } from '@webapp/store/user'

import { getDefaultSelectedIds, updateSelection } from './surveyCompareSelection'
import { getPropLabel } from './surveyCompareValueFormatter'
import { SurveyCompareNodeDefs } from './SurveyCompareNodeDefs'
import { SurveyCompareCategories } from './SurveyCompareCategories'
import { SurveyCompareTaxonomies } from './SurveyCompareTaxonomies'
import { SurveyCompareChangesList } from './SurveyCompareChangesList'

const hasDifferences = ({ added, changed, removed }: { added: number; changed: number; removed: number }) =>
  added + changed + removed > 0

const acceptedFiles = { 'application/zip': ['.zip'] }

// the dropzone max size unit is 1000 * 1000 bytes: the max size in MiB is converted to it
const maxFileSizeInDropzoneUnits = (SurveyCompareMaxFileSizeMB * 1024 * 1024) / (1000 * 1000)

const introStepKeys = ['exportFile', 'selectFile', 'applyChanges', 'publish']

type CompareResultWithSource = SurveyCompareResult & { source?: { name?: string } }

interface CompareState {
  result: CompareResultWithSource | null
  sourceFileName: string | null
  selectedIds: Set<string>
  selectedItemId: string | null
  /** Node defs matched by the user (renames): target uuid by source uuid. */
  manualMatches: Record<string, string>
}

const initialState: CompareState = {
  result: null,
  sourceFileName: null,
  selectedIds: new Set(),
  selectedItemId: null,
  manualMatches: {},
}

const summaryKeys = ['nodeDefs', 'categories', 'taxonomies', 'surveyFiles'] as const

const Summary = ({ result }: { result: CompareResultWithSource }) => {
  const i18n = useI18n()
  if (result.identical) {
    return (
      <div className="survey-compare__summary survey-compare__summary--identical">
        {i18n.t('surveyCompareView:identical')}
      </div>
    )
  }
  const { counts } = result
  return (
    <div className="survey-compare__summary">
      {summaryKeys
        .filter((key) => hasDifferences(counts[key]))
        .map((key) => (
          <div key={key}>
            <strong>{i18n.t(`surveyCompareView:tabs.${key}`)}:</strong>{' '}
            {i18n.t('surveyCompareView:counts', { ...counts[key] })}
          </div>
        ))}
      {result.surveyInfo.length > 0 && <div>{i18n.t('surveyCompareView:surveyInfoChanged')}</div>}
    </div>
  )
}

export const SurveyCompare = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const i18n = useI18n()
  const confirm = useConfirm()
  const surveyId = useSurveyId()
  const canEdit = useAuthCanEditSurvey()

  const [state, setState] = useState<CompareState>(initialState)
  const [file, setFile] = useState<File | null>(null)
  const [onlyDifferences, setOnlyDifferences] = useState(true)
  const [hideLayoutOnly, setHideLayoutOnly] = useState(false)
  const [tabKey, setTabKey] = useState<string | null>(null)
  const { result, sourceFileName, selectedIds, selectedItemId, manualMatches } = state

  const startCompare = useCallback(
    async ({ file = undefined, sourceFileName: sourceFileNameParam = undefined, manualMatches: matches = {} }) => {
      const { job } = await API.startSurveyCompareJob({
        surveyId,
        file,
        sourceFileName: sourceFileNameParam,
        manualMatches: matches,
      })
      dispatch(
        JobActions.showJobMonitor({
          job,
          autoHide: true,
          onComplete: async (jobCompleted: any) => {
            const { resultFileName, sourceFileName: sourceFileNameResult } = JobSerialized.getResult(jobCompleted)
            const resultFetched = await API.fetchSurveyCompareResult({ surveyId, resultFileName })
            setState((statePrev) => ({
              result: resultFetched,
              sourceFileName: sourceFileNameResult,
              selectedIds: getDefaultSelectedIds(resultFetched),
              selectedItemId: statePrev.selectedItemId,
              manualMatches: matches,
            }))
          },
        }) as any
      )
    },
    [dispatch, surveyId]
  )

  const onFileSelected = useCallback(
    (files: File[]) => {
      const fileSelected = files[0]
      if (!fileSelected) return
      if (fileSelected.size > SurveyCompareMaxFileSizeMB * 1024 * 1024) {
        dispatch(
          NotificationActions.notifyWarning({
            key: 'surveyCompareView:fileTooLarge',
            params: { maxSize: SurveyCompareMaxFileSizeMB },
            text: undefined,
          }) as any
        )
        return
      }
      setFile(fileSelected)
      setState(initialState)
      startCompare({ file: fileSelected })
    },
    [dispatch, startCompare]
  )

  const onToggle = useCallback(
    (id: string, selected: boolean) =>
      setState((statePrev) => ({
        ...statePrev,
        selectedIds: updateSelection({ result: statePrev.result, selectedIds: statePrev.selectedIds, id, selected }),
      })),
    []
  )

  const onSelectItem = useCallback((id: string) => setState((statePrev) => ({ ...statePrev, selectedItemId: id })), [])

  // a confirmed (or undone) rename changes the matching: the comparison is computed again
  const onMatch = useCallback(
    ({ sourceUuid, targetUuid }: { sourceUuid: string; targetUuid: string }) =>
      startCompare({ sourceFileName, manualMatches: { ...manualMatches, [sourceUuid]: targetUuid } }),
    [manualMatches, sourceFileName, startCompare]
  )

  const onUnmatch = useCallback(
    ({ sourceUuid }: { sourceUuid: string }) => {
      const matches = { ...manualMatches }
      delete matches[sourceUuid]
      startCompare({ sourceFileName, manualMatches: matches })
    },
    [manualMatches, sourceFileName, startCompare]
  )

  const onApply = useCallback(() => {
    confirm({
      key: 'surveyCompareView:applyConfirm',
      params: { count: selectedIds.size },
      onCancel: undefined,
      onOk: async () => {
        const { job } = await API.startSurveyCompareApplyJob({
          surveyId,
          sourceFileName,
          selectedIds: [...selectedIds],
          manualMatches,
        })
        dispatch(
          JobActions.showJobMonitor({
            job,
            autoHide: true,
            onComplete: async (jobCompleted: any) => {
              const { appliedIds = [], skippedIds = [] } = JobSerialized.getResult(jobCompleted) ?? {}
              dispatch(
                NotificationActions.notifyInfo({
                  key: 'surveyCompareView:applyCompleted',
                  params: { applied: appliedIds.length, skipped: skippedIds.length },
                  text: undefined,
                }) as any
              )
              dispatch(SurveyActions.refreshSurveyDefs({ navigate }) as any)
              await startCompare({ sourceFileName, manualMatches })
            },
          }) as any
        )
      },
    })
  }, [confirm, dispatch, manualMatches, navigate, selectedIds, sourceFileName, startCompare, surveyId])

  const tabProps = { result, canEdit, selectedIds, onToggle, onlyDifferences, selectedItemId, onSelectItem }
  const listProps = { canEdit, selectedIds, onToggle }

  // tabs of sections without differences are hidden
  const tabItems = result
    ? [
        {
          key: 'surveyInfo',
          label: 'surveyCompareView:tabs.surveyInfo',
          hasDifferences: result.surveyInfo.length > 0,
          renderContent: () => (
            <SurveyCompareChangesList
              diffs={result.surveyInfo}
              getLabel={(diff) => getPropLabel({ t: i18n.t, key: diff.key })}
              {...listProps}
            />
          ),
        },
        {
          key: 'nodeDefs',
          label: 'surveyCompareView:tabs.nodeDefs',
          hasDifferences: hasDifferences(result.counts.nodeDefs),
          renderContent: () => (
            <SurveyCompareNodeDefs
              {...tabProps}
              hideLayoutOnly={hideLayoutOnly}
              onMatch={onMatch}
              onUnmatch={onUnmatch}
            />
          ),
        },
        {
          key: 'categories',
          label: 'surveyCompareView:tabs.categories',
          hasDifferences: hasDifferences(result.counts.categories),
          renderContent: () => <SurveyCompareCategories {...tabProps} />,
        },
        {
          key: 'taxonomies',
          label: 'surveyCompareView:tabs.taxonomies',
          hasDifferences: hasDifferences(result.counts.taxonomies),
          renderContent: () => <SurveyCompareTaxonomies {...tabProps} />,
        },
        {
          key: 'surveyFiles',
          label: 'surveyCompareView:tabs.surveyFiles',
          hasDifferences: hasDifferences(result.counts.surveyFiles),
          renderContent: () => (
            <SurveyCompareChangesList
              diffs={result.surveyFiles}
              getLabel={(diff) => diff.name}
              getNote={(diff) => i18n.t(`surveyCompareView:fileTypes.${diff.fileType}`)}
              {...listProps}
            />
          ),
        },
      ].filter((item) => item.hasDifferences)
    : []
  const selectedTabKey = tabItems.some((item) => item.key === tabKey) ? tabKey : tabItems[0]?.key

  return (
    <div className="survey-compare">
      {!result && (
        <ol className="survey-compare__intro">
          {introStepKeys.map((key) => (
            <li key={key}>{i18n.t(`surveyCompareView:introSteps.${key}`)}</li>
          ))}
        </ol>
      )}
      <Dropzone
        accept={acceptedFiles}
        droppedFiles={file ? [file] : []}
        maxSize={maxFileSizeInDropzoneUnits}
        onDrop={onFileSelected}
      />
      <div className="survey-compare__header">
        {sourceFileName && (
          <Button
            iconClassName="icon-loop2 icon-12px"
            label="surveyCompareView:compareAgain"
            onClick={() => startCompare({ sourceFileName, manualMatches })}
            variant="outlined"
          />
        )}
        {result?.source?.name && (
          <span className="survey-compare__source-name">
            {i18n.t('surveyCompareView:sourceSurvey', { name: result.source.name })}
          </span>
        )}
      </div>

      {result && (
        <>
          <Summary result={result} />
          {!result.identical && (
            <>
              <div className="survey-compare__toolbar">
                <Checkbox
                  checked={onlyDifferences}
                  label="surveyCompareView:onlyDifferences"
                  onChange={setOnlyDifferences}
                />
                <Checkbox
                  checked={hideLayoutOnly}
                  label="surveyCompareView:hideLayoutOnly"
                  onChange={setHideLayoutOnly}
                />
                {canEdit && (
                  <Button
                    className="survey-compare__apply-btn"
                    disabled={selectedIds.size === 0}
                    label="surveyCompareView:apply"
                    labelParams={{ count: selectedIds.size }}
                    onClick={onApply}
                    primary
                  />
                )}
              </div>
              <Tabs items={tabItems} selectedItemKey={selectedTabKey} onChange={setTabKey} />
            </>
          )}
        </>
      )}
    </div>
  )
}
