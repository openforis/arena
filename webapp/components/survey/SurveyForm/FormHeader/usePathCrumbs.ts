import { NodeValueFormatter } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'

import { useSurvey, useSurveyCycleKey, useSurveyPreferredLang } from '@webapp/store/survey'
import { useNodeDefLabelType, useNodeDefPage, usePagesUuidMap } from '@webapp/store/ui/surveyForm'
import { useRecord } from '@webapp/store/ui/record'

export type FormPathCrumb = {
  key: string
  label: string
}

const getNodeValue = ({
  survey,
  cycle,
  nodeDef,
  node,
  lang,
}: {
  survey: ReturnType<typeof useSurvey>
  cycle: string
  nodeDef: object
  node: object
  lang: string
}) =>
  NodeValueFormatter.format({
    survey,
    cycle,
    nodeDef,
    node,
    value: Node.getValue(node),
    showLabel: true,
    quoteLabels: true,
    lang,
  })

/**
 * Builds the ordered list of breadcrumb labels for the current form page path.
 *
 * @param entry - Whether the form is in data entry mode
 * @returns Ordered breadcrumb items from root to the active page
 */
export const usePathCrumbs = (entry: boolean): FormPathCrumb[] => {
  const survey = useSurvey()
  const cycle = useSurveyCycleKey()
  let nodeDefCurrent = useNodeDefPage()
  const pagesUuidMap = usePagesUuidMap()
  const lang = useSurveyPreferredLang()
  const labelType = useNodeDefLabelType()
  const record = useRecord()

  const crumbs: FormPathCrumb[] = []

  while (nodeDefCurrent) {
    let label = NodeDef.getLabel(nodeDefCurrent, lang, labelType)

    if (entry && record && (NodeDef.isRoot(nodeDefCurrent) || NodeDef.isMultipleEntity(nodeDefCurrent))) {
      const nodeDefUuidCurrent = NodeDef.getUuid(nodeDefCurrent)
      const nodeUuidCurrent = pagesUuidMap[nodeDefUuidCurrent]

      const nodeCurrent = NodeDef.isSingle(nodeDefCurrent)
        ? Record.getNodesByDefUuid(nodeDefUuidCurrent)(record)[0]
        : Record.getNodeByUuid(nodeUuidCurrent)(record)

      if (nodeCurrent) {
        const nodeDefKeys = Survey.getNodeDefKeysSorted({ nodeDef: nodeDefCurrent, cycle })(survey)
        const keys = nodeDefKeys.map((nodeDefKey) => {
          const nodeKeys = Record.getNodeChildrenByDefUuid(nodeCurrent, NodeDef.getUuid(nodeDefKey))(record)
          return nodeKeys.map((nodeKey) => getNodeValue({ survey, cycle, nodeDef: nodeDefKey, node: nodeKey, lang }))
        })
        label += ` [${keys.flat().join(', ')}]`
      }
    }

    crumbs.unshift({
      key: NodeDef.getUuid(nodeDefCurrent),
      label,
    })

    nodeDefCurrent = Survey.getNodeDefParent(nodeDefCurrent)(survey)
  }

  return crumbs
}
