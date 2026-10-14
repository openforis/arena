import './SurveyCompare.scss'

import React, { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'
import classNames from 'classnames'

import * as JobSerialized from '@common/job/jobSerialized'
import { SurveyCompareMaxFileSizeMB, SurveyCompareResult } from '@core/survey/surveyCompare/surveyCompareTypes'

import * as API from '@webapp/service/api'
import { Button } from '@webapp/components/buttons'
import { Checkbox, UploadButton } from '@webapp/components/form'
import { Tabs } from '@webapp/components/Tabs'
import { useConfirm } from '@webapp/components/hooks'
import { JobActions } from '@webapp/store/app'
import { SurveyActions, useSurveyId } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { NotificationActions } from '@webapp/store/ui'
import { useAuthCanEditSurvey } from '@webapp/store/user'

import { getDefaultSelectedIds, updateSelection } from './surveyCompareSelection'
import { StatusBadge } from './SurveyCompareCommon'
import { SurveyCompareNodeDefs } from './SurveyCompareNodeDefs'
import { SurveyCompareCategories } from './SurveyCompareCategories'
import { SurveyComparePropDiffs } from './SurveyComparePropDiffs'

const introStepKeys = ['exportFile', 'selectFile', 'applyChanges', 'publish']

type CompareResultWithSource = SurveyCompareResult & { source?: { name?: string } }

interface CompareState {
  result: CompareResultWithSource | null
  sourceFileName: string | null
  selectedIds: Set<string>
  selectedItemId: string | null
}

const initialState: CompareState = { result: null, sourceFileName: null, selectedIds: new Set(), selectedItemId: null }

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
      {(['nodeDefs', 'categories', 'taxonomies'] as const).map((key) => (
        <div key={key}>
          <strong>{i18n.t(`surveyCompareView:tabs.${key}`)}:</strong> {i18n.t('surveyCompareView:counts', counts[key])}
        </div>
      ))}
      {result.surveyInfo.length > 0 && <div>{i18n.t('surveyCompareView:surveyInfoChanged')}</div>}
    </div>
  )
}

const Taxonomies = ({ result, onlyDifferences }: { result: SurveyCompareResult; onlyDifferences: boolean }) => {
  const i18n = useI18n()
  const diffs = result.taxonomies.filter((diff) => !onlyDifferences || diff.status !== 'identical')
  if (diffs.length === 0) {
    return <div className="survey-compare__details-empty">{i18n.t('surveyCompareView:noDifferences')}</div>
  }
  return (
    <div className="survey-compare__simple-list">
      <div className="survey-compare__details-info">{i18n.t('surveyCompareView:taxonomiesNote')}</div>
      {diffs.map((diff) => (
        <div key={diff.id} className="survey-compare__simple-item">
          <div className={classNames('survey-compare__row', `survey-compare__row--${diff.status}`)}>
            <span className="survey-compare__row-name">{diff.name}</span>
            <StatusBadge status={diff.status} />
          </div>
          <SurveyComparePropDiffs propDiffs={diff.propDiffs} />
        </div>
      ))}
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
  const [onlyDifferences, setOnlyDifferences] = useState(true)
  const [hideLayoutOnly, setHideLayoutOnly] = useState(false)
  const { result, sourceFileName, selectedIds, selectedItemId } = state

  const startCompare = useCallback(
    async ({ file = undefined, sourceFileName: sourceFileNameParam = undefined }) => {
      const { job } = await API.startSurveyCompareJob({ surveyId, file, sourceFileName: sourceFileNameParam })
      dispatch(
        JobActions.showJobMonitor({
          job,
          autoHide: true,
          onComplete: async (jobCompleted: any) => {
            const { resultFileName, sourceFileName: sourceFileNameResult } = JobSerialized.getResult(jobCompleted)
            const resultFetched = await API.fetchSurveyCompareResult({ surveyId, resultFileName })
            setState({
              result: resultFetched,
              sourceFileName: sourceFileNameResult,
              selectedIds: getDefaultSelectedIds(resultFetched),
              selectedItemId: null,
            })
          },
        }) as any
      )
    },
    [dispatch, surveyId]
  )

  const onFileSelected = useCallback(
    (files: FileList) => {
      const file = files[0]
      if (file.size > SurveyCompareMaxFileSizeMB * 1024 * 1024) {
        dispatch(
          NotificationActions.notifyWarning({
            key: 'surveyCompareView:fileTooLarge',
            params: { maxSize: SurveyCompareMaxFileSizeMB },
            text: undefined,
          }) as any
        )
        return
      }
      startCompare({ file })
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
              await startCompare({ sourceFileName })
            },
          }) as any
        )
      },
    })
  }, [confirm, dispatch, navigate, selectedIds, sourceFileName, startCompare, surveyId])

  const tabProps = { result, canEdit, selectedIds, onToggle, onlyDifferences, selectedItemId, onSelectItem }

  return (
    <div className="survey-compare">
      <div className="survey-compare__header">
        <UploadButton
          accept=".zip"
          label="surveyCompareView:selectFile"
          maxSize={Number.MAX_SAFE_INTEGER} // size checked in onFileSelected, with a specific message
          onChange={onFileSelected}
        />
        {sourceFileName && (
          <Button
            iconClassName="icon-loop2 icon-12px"
            label="surveyCompareView:compareAgain"
            onClick={() => startCompare({ sourceFileName })}
            variant="outlined"
          />
        )}
        {result?.source?.name && (
          <span className="survey-compare__source-name">
            {i18n.t('surveyCompareView:sourceSurvey', { name: result.source.name })}
          </span>
        )}
      </div>

      {!result && (
        <ol className="survey-compare__intro">
          {introStepKeys.map((key) => (
            <li key={key}>{i18n.t(`surveyCompareView:introSteps.${key}`)}</li>
          ))}
        </ol>
      )}

      {result && (
        <>
          <Summary result={result} />
          <div className="survey-compare__toolbar">
            <Checkbox
              checked={onlyDifferences}
              label="surveyCompareView:onlyDifferences"
              onChange={setOnlyDifferences}
            />
            <Checkbox checked={hideLayoutOnly} label="surveyCompareView:hideLayoutOnly" onChange={setHideLayoutOnly} />
            {canEdit && !result.identical && (
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
          <Tabs
            items={[
              {
                key: 'nodeDefs',
                label: 'surveyCompareView:tabs.nodeDefs',
                renderContent: () => <SurveyCompareNodeDefs {...tabProps} hideLayoutOnly={hideLayoutOnly} />,
              },
              {
                key: 'categories',
                label: 'surveyCompareView:tabs.categories',
                renderContent: () => <SurveyCompareCategories {...tabProps} />,
              },
              {
                key: 'taxonomies',
                label: 'surveyCompareView:tabs.taxonomies',
                renderContent: () => <Taxonomies result={result} onlyDifferences={onlyDifferences} />,
              },
              {
                key: 'surveyInfo',
                label: 'surveyCompareView:tabs.surveyInfo',
                renderContent: () =>
                  result.surveyInfo.length > 0 ? (
                    <SurveyComparePropDiffs propDiffs={result.surveyInfo} />
                  ) : (
                    <div className="survey-compare__details-empty">{i18n.t('surveyCompareView:noDifferences')}</div>
                  ),
              },
            ]}
          />
        </>
      )}
    </div>
  )
}
