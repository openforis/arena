import React, { useCallback, useMemo, useState } from 'react'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { TreeView } from '@webapp/components/TreeView'
import * as API from '@webapp/service/api'
import { surveyInfoToLabel, useOtherSurveysList } from '@webapp/components/hooks'
import { useI18n } from '@webapp/store/system'
import { useSurveyPreferredLang } from '@webapp/store/survey'
import * as NodeDefUIProps from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefUIProps'

export interface SourceNodeDefSelection {
  surveyId: number
  nodeDefUuid: string
}

interface SurveyLoadState {
  loading: boolean
  error: boolean
  survey: object | null
}

interface TreeItem {
  key: string
  label: string
  icon?: React.ReactNode
  disabled?: boolean
  items?: TreeItem[]
}

interface SurveyNodeDefsTreeViewProps {
  selectedSourceNodeDef: SourceNodeDefSelection | null
  onSourceNodeDefSelectionChange: (selection: SourceNodeDefSelection | null) => void
}

const surveyTreeItemPrefix = 'survey:'
const sourceNodeDefTreeItemPrefix = 'source-node-def:'

const toSurveyTreeItemKey = (surveyId: number): string => `${surveyTreeItemPrefix}${surveyId}`

const toSourceNodeDefTreeItemKey = ({ surveyId, nodeDefUuid }: SourceNodeDefSelection): string =>
  `${sourceNodeDefTreeItemPrefix}${surveyId}:${nodeDefUuid}`

const isSurveyTreeItemKey = (treeItemKey: string | undefined): boolean =>
  treeItemKey?.startsWith(surveyTreeItemPrefix) ?? false

const isSourceNodeDefTreeItemKey = (treeItemKey: string | undefined): boolean =>
  treeItemKey?.startsWith(sourceNodeDefTreeItemPrefix) ?? false

const getSurveyIdFromSurveyTreeItemKey = (treeItemKey: string): number =>
  Number(treeItemKey.replace(surveyTreeItemPrefix, ''))

const parseSourceNodeDefTreeItemKey = (treeItemKey: string): SourceNodeDefSelection => {
  const value = treeItemKey.replace(sourceNodeDefTreeItemPrefix, '')
  const [surveyIdString, nodeDefUuid] = value.split(':')
  return { surveyId: Number(surveyIdString), nodeDefUuid }
}

const getChildNodeDefs = ({ survey, nodeDef }: { survey: object; nodeDef: object }): object[] =>
  Survey.getNodeDefChildrenSorted({ nodeDef })(survey)

const toNodeDefTreeItems = ({
  nodeDefs,
  lang,
  cycle,
  surveyId,
  surveyLoaded,
}: {
  nodeDefs: object[]
  lang: string
  cycle: string
  surveyId: number
  surveyLoaded: object
}): TreeItem[] =>
  nodeDefs.map((nodeDef) => {
    const nodeDefUuid = NodeDef.getUuid(nodeDef)
    const isEntity = NodeDef.isEntity(nodeDef)

    return {
      key: toSourceNodeDefTreeItemKey({ surveyId, nodeDefUuid }),
      label: NodeDef.getLabelWithType({ nodeDef, lang, type: NodeDef.NodeDefLabelTypes.labelAndName }),
      icon: NodeDefUIProps.getIconByNodeDef({ nodeDef, cycle, includeKey: true }),
      items: isEntity
        ? toNodeDefTreeItems({
            nodeDefs: getChildNodeDefs({ survey: surveyLoaded, nodeDef }),
            lang,
            cycle,
            surveyId,
            surveyLoaded,
          })
        : undefined,
    }
  })

export const SurveyNodeDefsTreeView = (props: SurveyNodeDefsTreeViewProps): React.ReactElement | null => {
  const { selectedSourceNodeDef, onSourceNodeDefSelectionChange } = props

  const i18n = useI18n()
  const lang = useSurveyPreferredLang()

  const { surveys, surveysLoading } = useOtherSurveysList()
  const [expandedTreeItemKeys, setExpandedTreeItemKeys] = useState<string[]>([])
  const [surveyLoadedById, setSurveyLoadedById] = useState<Record<string, SurveyLoadState>>({})

  const surveyById = useMemo(
    () =>
      surveys.reduce<Record<string, object>>((acc, surveyInfo) => {
        const surveyId = Survey.getIdSurveyInfo(surveyInfo)
        acc[surveyId] = surveyInfo
        return acc
      }, {}),
    [surveys]
  )

  const loadSurvey = useCallback(
    async (surveyId: number) => {
      if (surveyLoadedById[surveyId]?.loading || surveyLoadedById[surveyId]?.survey) {
        return
      }

      setSurveyLoadedById((statePrev) => ({
        ...statePrev,
        [surveyId]: { loading: true, error: false, survey: null },
      }))

      try {
        const surveyInfo = surveyById[surveyId]
        const cycleKeys = Survey.getCycleKeys(surveyInfo)
        const surveyCycleKey = cycleKeys[0]
        const survey = await API.fetchSurveyFull({
          surveyId,
          cycle: surveyCycleKey,
          draft: false,
          advanced: true,
          includeAnalysis: false,
          validate: false,
        } as any)

        setSurveyLoadedById((statePrev) => ({
          ...statePrev,
          [surveyId]: { loading: false, error: false, survey },
        }))
      } catch {
        setSurveyLoadedById((statePrev) => ({
          ...statePrev,
          [surveyId]: { loading: false, error: true, survey: null },
        }))
      }
    },
    [surveyById, surveyLoadedById]
  )

  const onExpandedTreeItemKeysChange = useCallback(
    (treeItemKeys: string[]) => {
      setExpandedTreeItemKeys(treeItemKeys)

      const surveyTreeItemsBeingExpanded = treeItemKeys.filter(
        (treeItemKey) => isSurveyTreeItemKey(treeItemKey) && !expandedTreeItemKeys.includes(treeItemKey)
      )

      surveyTreeItemsBeingExpanded.forEach((surveyTreeItemKey) => {
        const surveyId = getSurveyIdFromSurveyTreeItemKey(surveyTreeItemKey)
        loadSurvey(surveyId)
      })
    },
    [expandedTreeItemKeys, loadSurvey]
  )

  const treeItems = useMemo(
    () =>
      surveys.map((surveyInfo) => {
        const surveyId = Survey.getIdSurveyInfo(surveyInfo)
        const surveyTreeItemKey = toSurveyTreeItemKey(surveyId)
        const surveyLoaded = surveyLoadedById[surveyId]

        let items: TreeItem[]

        if (surveyLoaded?.loading) {
          items = [
            {
              key: `${surveyTreeItemKey}:loading`,
              label: i18n.t('surveyForm:cloneFromAnotherSurvey.loadingSurveyNodes'),
              disabled: true,
            },
          ]
        } else if (surveyLoaded?.error) {
          items = [
            {
              key: `${surveyTreeItemKey}:error`,
              label: i18n.t('surveyForm:cloneFromAnotherSurvey.errorLoadingSurveyNodes'),
              disabled: true,
            },
          ]
        } else if (surveyLoaded?.survey) {
          const rootNodeDef = Survey.getNodeDefRoot(surveyLoaded.survey)
          const rootNodeDefChildren = getChildNodeDefs({ survey: surveyLoaded.survey, nodeDef: rootNodeDef })
          const cycle = Survey.getDefaultCycleKey(Survey.getSurveyInfo(surveyLoaded.survey))

          items =
            rootNodeDefChildren.length > 0
              ? toNodeDefTreeItems({
                  nodeDefs: rootNodeDefChildren,
                  lang,
                  cycle,
                  surveyId,
                  surveyLoaded: surveyLoaded.survey,
                })
              : [
                  {
                    key: `${surveyTreeItemKey}:empty`,
                    label: i18n.t('surveyForm:cloneFromAnotherSurvey.noNodesAvailable'),
                    disabled: true,
                  },
                ]
        } else {
          items = [
            {
              key: `${surveyTreeItemKey}:placeholder`,
              label: i18n.t('surveyForm:cloneFromAnotherSurvey.expandToLoadNodes'),
              disabled: true,
            },
          ]
        }

        return {
          key: surveyTreeItemKey,
          label: surveyInfoToLabel(surveyInfo),
          items,
        }
      }),
    [i18n, lang, surveyLoadedById, surveys]
  )

  const selectedSourceNodeDefTreeItemKey = useMemo(
    () =>
      selectedSourceNodeDef
        ? [
            toSourceNodeDefTreeItemKey({
              surveyId: selectedSourceNodeDef.surveyId,
              nodeDefUuid: selectedSourceNodeDef.nodeDefUuid,
            }),
          ]
        : [],
    [selectedSourceNodeDef]
  )

  const onSelectedTreeItemKeysChange = useCallback(
    (selectedTreeItemKeys: string | string[]) => {
      const selectedTreeItemKey = Array.isArray(selectedTreeItemKeys) ? selectedTreeItemKeys[0] : selectedTreeItemKeys

      if (!isSourceNodeDefTreeItemKey(selectedTreeItemKey)) {
        return
      }

      onSourceNodeDefSelectionChange(parseSourceNodeDefTreeItemKey(selectedTreeItemKey))
    },
    [onSourceNodeDefSelectionChange]
  )

  if (surveysLoading) {
    return (
      <div className="clone-from-survey-dialog__message">
        {i18n.t('surveyForm:cloneFromAnotherSurvey.loadingSurveys')}
      </div>
    )
  }

  if (treeItems.length === 0) {
    return (
      <div className="clone-from-survey-dialog__message">
        {i18n.t('surveyForm:cloneFromAnotherSurvey.noSurveysAvailable')}
      </div>
    )
  }

  return (
    <TreeView
      expadedItemKeys={expandedTreeItemKeys}
      items={treeItems}
      onExpandedItemKeysChange={onExpandedTreeItemKeysChange}
      onSelectedItemKeysChange={onSelectedTreeItemKeysChange}
      selectedItemKeys={selectedSourceNodeDefTreeItemKey}
    />
  )
}
