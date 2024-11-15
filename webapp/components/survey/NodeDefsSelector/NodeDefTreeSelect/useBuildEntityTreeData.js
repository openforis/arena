import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'

import * as NodeDefUIProps from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefUIProps'
import { useSurvey, useSurveyCycleKey, useSurveyPreferredLang } from '@webapp/store/survey'
import { useRecord } from '@webapp/store/ui/record'
import { useNodeDefLabelType, usePagesUuidMap } from '@webapp/store/ui/surveyForm'
import { TestId } from '@webapp/utils/testId'

const getPageNode = ({ record, pagesUuidMap, nodeDefUuid }) => {
  const nodeUuid = pagesUuidMap[nodeDefUuid]
  return record && nodeUuid ? Record.getNodeByUuid(nodeUuid)(record) : null
}

const isPageVisible = ({ cycle, record, pageNodeDef, parentNode }) =>
  NodeDef.isRoot(pageNodeDef) ||
  !NodeDefLayout.isHiddenWhenNotRelevant(cycle)(pageNodeDef) ||
  Node.isChildApplicable(NodeDef.getUuid(pageNodeDef))(parentNode) ||
  // has some non-empty descendant
  Record.getNodeChildrenByDefUuid(
    parentNode,
    NodeDef.getUuid(pageNodeDef)
  )(record).some((pageChildNode) => !Record.isNodeEmpty(pageChildNode)(record))

const getNodeDefAvailableChildren = ({
  survey,
  cycle,
  pagesUuidMap,
  nodeDef,
  record,
  onlyPages,
  includeMultipleAttributes,
  includeSingleAttributes,
  includeSingleEntities,
  isDisabled,
}) => {
  const pageNode = getPageNode({ record, pagesUuidMap, nodeDefUuid: NodeDef.getUuid(nodeDef) })
  const parentPageNode = getPageNode({ record, pagesUuidMap, nodeDefUuid: NodeDef.getParentUuid(nodeDef) })

  const hidden =
    !NodeDef.isRoot(nodeDef) &&
    record &&
    parentPageNode &&
    !isPageVisible({ cycle, record, pageNodeDef: nodeDef, parentNode: parentPageNode })

  let children = null
  if (onlyPages) {
    children = Survey.getNodeDefChildrenInOwnPage({ nodeDef, cycle })(survey)
  } else if (includeSingleEntities) {
    children = Survey.getNodeDefChildrenSorted({ nodeDef, cycle })(survey)
  } else {
    children = Survey.getNodeDefDescendantsInSingleEntities({
      cycle,
      nodeDef,
      sorted: true,
    })(survey)
  }
  const childrenFiltered = children.filter((nodeDef) => {
    const multiple = NodeDef.isMultiple(nodeDef)
    if (multiple) {
      return NodeDef.isEntity(nodeDef) || includeMultipleAttributes
    } else {
      return (
        (includeSingleEntities && NodeDef.isEntity(nodeDef)) ||
        (includeSingleAttributes && NodeDef.isAttribute(nodeDef))
      )
    }
  })

  const visibleChildren = pageNode
    ? childrenFiltered.filter((childDef) =>
        isPageVisible({ cycle, record, pageNodeDef: childDef, parentNode: pageNode })
      )
    : childrenFiltered

  return visibleChildren.filter((childDef) => !isDisabled(childDef) && !hidden)
}

export const useBuildTreeData = ({
  nodeDefLabelType: nodeDefLabelTypeProp,
  getLabelSuffix,
  onlyPages,
  includeMultipleAttributes,
  includeSingleAttributes,
  includeSingleEntities,
  isDisabled,
}) => {
  const survey = useSurvey()
  const cycle = useSurveyCycleKey()
  const lang = useSurveyPreferredLang()
  const record = useRecord()
  const pagesUuidMap = usePagesUuidMap()
  const nodeDefLabelTypeInStore = useNodeDefLabelType()
  const nodeDefLabelType = nodeDefLabelTypeProp ?? nodeDefLabelTypeInStore
  const showIcons = includeSingleAttributes

  const stack = []

  const nodeDefRoot = Survey.getNodeDefRoot(survey)
  stack.push({ parentTreeItem: null, parentNodeDef: null, nodeDef: nodeDefRoot })

  const buildTreeItem = ({ nodeDef }) => {
    const nodeDefLabel = NodeDef.getLabelWithType({ nodeDef, lang, type: nodeDefLabelType })
    const suffix = getLabelSuffix(nodeDef)
    return {
      key: NodeDef.getUuid(nodeDef),
      icon: showIcons ? NodeDefUIProps.getIconByNodeDef(nodeDef, true) : undefined,
      label: `${nodeDefLabel}${suffix}`,
      testId: TestId.surveyForm.pageLinkBtn(NodeDef.getName(nodeDef)),
    }
  }

  const treeItemKeys = []
  let rootTreeItem = null

  while (stack.length > 0) {
    const { nodeDef, parentTreeItem } = stack.pop()
    const treeItem = buildTreeItem({ nodeDef })
    if (!rootTreeItem) {
      rootTreeItem = treeItem
    }

    treeItemKeys.push(treeItem.key)

    if (parentTreeItem) {
      if (!parentTreeItem.items) parentTreeItem.items = []
      parentTreeItem.items.push(treeItem)
    }

    const children = getNodeDefAvailableChildren({
      survey,
      cycle,
      pagesUuidMap,
      nodeDef,
      record,
      onlyPages,
      includeMultipleAttributes,
      includeSingleAttributes,
      includeSingleEntities,
      isDisabled,
    })
    if (children.length > 0) {
      const childrenItems = children.map((childDef) => ({
        parentTreeItem: treeItem,
        parentNodeDef: nodeDef,
        nodeDef: childDef,
      }))
      stack.push(...childrenItems.reverse())
    }
  }
  return { treeItems: [rootTreeItem], treeItemKeys }
}
