import React, { useCallback, useEffect, useMemo, useState } from 'react'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { TreeView } from '@webapp/components/TreeView'
import * as API from '@webapp/service/api'
import { useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'

export interface SourceEntitySelection {
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
  disabled?: boolean
  items?: TreeItem[]
}

interface SurveyEntitiesTreeViewProps {
  selectedSourceEntity: SourceEntitySelection | null
  onSourceEntitySelectionChange: (selection: SourceEntitySelection | null) => void
}

const surveyTreeItemPrefix = 'survey:'
const sourceEntityTreeItemPrefix = 'source-entity:'

const toSurveyTreeItemKey = (surveyId: number): string => `${surveyTreeItemPrefix}${surveyId}`

const toSourceEntityTreeItemKey = ({ surveyId, nodeDefUuid }: SourceEntitySelection): string =>
  `${sourceEntityTreeItemPrefix}${surveyId}:${nodeDefUuid}`

const isSurveyTreeItemKey = (treeItemKey: string | undefined): boolean =>
  treeItemKey?.startsWith(surveyTreeItemPrefix) ?? false

const isSourceEntityTreeItemKey = (treeItemKey: string | undefined): boolean =>
  treeItemKey?.startsWith(sourceEntityTreeItemPrefix) ?? false

const getSurveyIdFromSurveyTreeItemKey = (treeItemKey: string): number =>
  Number(treeItemKey.replace(surveyTreeItemPrefix, ''))

const parseSourceEntityTreeItemKey = (treeItemKey: string): SourceEntitySelection => {
  const value = treeItemKey.replace(sourceEntityTreeItemPrefix, '')
  const [surveyIdString, nodeDefUuid] = value.split(':')
  return { surveyId: Number(surveyIdString), nodeDefUuid }
}

const surveyInfoToLabel = (surveyInfo: object): string => {
  const surveyName = Survey.getName(surveyInfo)
  const surveyLabel = Survey.getDefaultLabel(surveyInfo)
  return surveyLabel ? `${surveyLabel} [${surveyName}]` : surveyName
}

const getEntityChildren = ({ survey, nodeDef }: { survey: object; nodeDef: object }): object[] =>
  Survey.getNodeDefChildrenSorted({ nodeDef })(survey).filter((childNodeDef: object) => NodeDef.isEntity(childNodeDef))

const toEntityTreeItems = ({
  nodeDefs,
  lang,
  surveyId,
  surveyLoaded,
}: {
  nodeDefs: object[]
  lang: string
  surveyId: number
  surveyLoaded: object
}): TreeItem[] =>
  nodeDefs.map((nodeDef) => {
    const nodeDefUuid = NodeDef.getUuid(nodeDef)

    return {
      key: toSourceEntityTreeItemKey({ surveyId, nodeDefUuid }),
      label: NodeDef.getLabelWithType({ nodeDef, lang, type: NodeDef.NodeDefLabelTypes.labelAndName }),
      items: toEntityTreeItems({
        nodeDefs: getEntityChildren({ survey: surveyLoaded, nodeDef }),
        lang,
        surveyId,
        surveyLoaded,
      }),
    }
  })

export const SurveyEntitiesTreeView = (props: SurveyEntitiesTreeViewProps): React.ReactElement | null => {
  const { selectedSourceEntity, onSourceEntitySelectionChange } = props

  const currentSurvey = useSurvey()
  const currentSurveyId = Survey.getId(currentSurvey)
  const lang = useSurveyPreferredLang()

  const [surveys, setSurveys] = useState<object[]>([])
  const [surveysLoading, setSurveysLoading] = useState(true)
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

  useEffect(() => {
    Promise.all([API.fetchSurveys({ draft: false }), API.fetchSurveys({ draft: true })])
      .then(([surveysPublished, surveysDraft]) => {
        const surveysById = [...surveysPublished, ...surveysDraft].reduce<Record<string, object>>((acc, surveyInfo) => {
          acc[Survey.getIdSurveyInfo(surveyInfo)] = surveyInfo
          return acc
        }, {})

        const surveysFiltered = Object.values(surveysById)
          .filter((surveyInfo) => Survey.getIdSurveyInfo(surveyInfo) !== currentSurveyId)
          .sort((surveyA, surveyB) => {
            const surveyALabel = Survey.getDefaultLabel(surveyA) ?? ''
            const surveyBLabel = Survey.getDefaultLabel(surveyB) ?? ''
            const labelCompare = surveyALabel.localeCompare(surveyBLabel)
            if (labelCompare !== 0) return labelCompare
            const surveyAName = Survey.getName(surveyA)
            const surveyBName = Survey.getName(surveyB)
            return surveyAName.localeCompare(surveyBName)
          })

        setSurveys(surveysFiltered)
      })
      .catch(() => {
        setSurveys([])
      })
      .finally(() => {
        setSurveysLoading(false)
      })
  }, [currentSurveyId])

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

        let items: TreeItem[] = [
          { key: `${surveyTreeItemKey}:placeholder`, label: 'Expand to load entities', disabled: true },
        ]

        if (surveyLoaded?.loading) {
          items = [{ key: `${surveyTreeItemKey}:loading`, label: 'Loading survey entities...', disabled: true }]
        } else if (surveyLoaded?.error) {
          items = [{ key: `${surveyTreeItemKey}:error`, label: 'Error loading survey entities', disabled: true }]
        } else if (surveyLoaded?.survey) {
          const rootNodeDef = Survey.getNodeDefRoot(surveyLoaded.survey)
          const rootEntityChildren = getEntityChildren({ survey: surveyLoaded.survey, nodeDef: rootNodeDef })

          items =
            rootEntityChildren.length > 0
              ? toEntityTreeItems({
                  nodeDefs: rootEntityChildren,
                  lang,
                  surveyId,
                  surveyLoaded: surveyLoaded.survey,
                })
              : [{ key: `${surveyTreeItemKey}:empty`, label: 'No entities available', disabled: true }]
        }

        return {
          key: surveyTreeItemKey,
          label: surveyInfoToLabel(surveyInfo),
          items,
        }
      }),
    [lang, surveyLoadedById, surveys]
  )

  const selectedSourceEntityTreeItemKey = selectedSourceEntity
    ? [
        toSourceEntityTreeItemKey({
          surveyId: selectedSourceEntity.surveyId,
          nodeDefUuid: selectedSourceEntity.nodeDefUuid,
        }),
      ]
    : []

  const onSelectedTreeItemKeysChange = useCallback(
    (selectedTreeItemKeys: string | string[]) => {
      const selectedTreeItemKey = Array.isArray(selectedTreeItemKeys) ? selectedTreeItemKeys[0] : selectedTreeItemKeys

      if (!isSourceEntityTreeItemKey(selectedTreeItemKey)) {
        return
      }

      onSourceEntitySelectionChange(parseSourceEntityTreeItemKey(selectedTreeItemKey))
    },
    [onSourceEntitySelectionChange]
  )

  if (surveysLoading) {
    return <div className="clone-from-survey-dialog__message">Loading surveys...</div>
  }

  if (treeItems.length === 0) {
    return <div className="clone-from-survey-dialog__message">No surveys available</div>
  }

  return (
    <TreeView
      expadedItemKeys={expandedTreeItemKeys}
      items={treeItems}
      onExpandedItemKeysChange={onExpandedTreeItemKeysChange}
      onSelectedItemKeysChange={onSelectedTreeItemKeysChange}
      selectedItemKeys={selectedSourceEntityTreeItemKey}
    />
  )
}
