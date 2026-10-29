import { useCallback, useEffect, useRef, useState } from 'react'

import type { ArenaRecord, User as ArenaUser } from '@openforis/arena-core'

import * as Authorizer from '@core/auth/authorizer'
import * as Record from '@core/record/record'
import * as Survey from '@core/survey/survey'
import { uuidv4 } from '@core/uuid'

import { useSurveyCycleKey, useSurveyId, useSurveyInfo } from '@webapp/store/survey'
import { useLang } from '@webapp/store/system'
import { useUser } from '@webapp/store/user'

import { getAvailableSpaceBytes } from '@webapp/components/MapContainer/workspace/screenshot/screenshotChecks'
import {
  buildScreenshotFileValue,
  buildScreenshotNodeChange,
} from '@webapp/components/MapContainer/workspace/screenshot/screenshotNode'
import {
  describeSaveError,
  saveScreenshotToRecord,
  type ScreenshotSaveDeps,
} from '@webapp/components/MapContainer/workspace/screenshot/screenshotSave'
import {
  createNodePoster,
  createRecordFetcher,
  subscribeToNodeSaveEvents,
} from '@webapp/components/MapContainer/workspace/screenshot/screenshotSaveAdapters'
import type {
  ScreenshotImageAttributeOption,
  ScreenshotPlotCandidate,
  ScreenshotSaveOutcome,
} from '@webapp/components/MapContainer/workspace/screenshot/screenshotTypes'

export type ScreenshotSaveRequest = {
  plot: ScreenshotPlotCandidate
  attribute: ScreenshotImageAttributeOption
  blob: Blob
  fileName: string
}

export type ScreenshotReplacePrompt = { fileName: string } | null

/**
 * Builds the node change function of a save request.
 * @param {ScreenshotSaveRequest} request - The save request.
 * @returns {Function} Builds the change from the fetched record.
 */
const createChangeBuilder =
  ({ plot, attribute, blob, fileName }: ScreenshotSaveRequest) =>
  (record: unknown) =>
    buildScreenshotNodeChange({
      nodes: Record.getNodesArray(record),
      recordUuid: plot.recordUuid,
      parentUuid: plot.parentUuid,
      entityDefUuid: plot.entityDefUuid,
      attributeDefUuid: attribute.uuid,
      attributeParentDefUuid: attribute.parentUuid,
      attributeMultiple: attribute.multiple,
      value: buildScreenshotFileValue({ fileUuid: uuidv4(), fileName, fileSize: blob.size }),
    })

/**
 * Saves screenshots in plot records; the replace confirmation is shown inside the dialog (works in full screen).
 * @returns {object} save(request), saving flag, the pending replace prompt and the answer function.
 */
export const useScreenshotSave = (): {
  save: (request: ScreenshotSaveRequest) => Promise<ScreenshotSaveOutcome>
  saving: boolean
  replacePrompt: ScreenshotReplacePrompt
  answerReplace: (replace: boolean) => void
} => {
  const surveyId = useSurveyId()
  const surveyInfo = useSurveyInfo()
  const cycle = useSurveyCycleKey()
  const user = useUser()
  const lang = useLang()
  const [saving, setSaving] = useState(false)
  const [replacePrompt, setReplacePrompt] = useState<ScreenshotReplacePrompt>(null)
  const resolveReplaceRef = useRef<((replace: boolean) => void) | null>(null)

  const confirmReplace = useCallback(
    (fileName: string) =>
      new Promise<boolean>((resolve) => {
        resolveReplaceRef.current = resolve
        setReplacePrompt({ fileName })
      }),
    []
  )

  // a prompt still open when the dialog unmounts is answered "keep": the save never stays suspended
  useEffect(
    () => () => {
      const resolve = resolveReplaceRef.current
      resolveReplaceRef.current = null
      resolve?.(false)
    },
    []
  )

  const answerReplace = useCallback((replace: boolean) => {
    const resolve = resolveReplaceRef.current
    resolveReplaceRef.current = null
    setReplacePrompt(null)
    resolve?.(replace)
  }, [])

  const save = useCallback(
    async (request: ScreenshotSaveRequest): Promise<ScreenshotSaveOutcome> => {
      const deps: ScreenshotSaveDeps = {
        fetchRecord: createRecordFetcher({ surveyId }),
        canEditRecord: (record) =>
          Survey.isPublished(surveyInfo) && Authorizer.canEditRecord(user as ArenaUser, record as ArenaRecord),
        buildChange: createChangeBuilder(request),
        confirmReplace,
        subscribe: subscribeToNodeSaveEvents,
        postNode: createNodePoster({ surveyId, lang, fallbackCycle: cycle }),
      }
      setSaving(true)
      try {
        return await saveScreenshotToRecord(deps, {
          recordUuid: request.plot.recordUuid,
          blob: request.blob,
          fileName: request.fileName,
          maxFileSizeMb: request.attribute.maxFileSizeMb,
          availableSpaceBytes: getAvailableSpaceBytes(Survey.getFilesStatistics(surveyInfo)),
        })
      } catch (error) {
        const details = describeSaveError(error)
        return { status: 'error', key: 'mapWorkspace.screenshot.errors.saveFailed', params: { details } }
      } finally {
        setSaving(false)
      }
    },
    [confirmReplace, cycle, lang, surveyId, surveyInfo, user]
  )

  return { save, saving, replacePrompt, answerReplace }
}
