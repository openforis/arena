import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as Node from '@core/record/node'
import * as Record from '@core/record/record'

type IsChildFilledParams = { record: any; parentNode: any; childDefUuid: string }

export const isChildFilledByUser = ({ record, parentNode, childDefUuid }: IsChildFilledParams): boolean =>
  !!record &&
  !!parentNode &&
  Record.getNodeChildrenByDefUuid(
    parentNode,
    childDefUuid
  )(record).some((child: any) => Record.isNodeFilledByUser(child)(record))

// a not relevant field marked as 'hidden when not relevant' is shown (as not relevant) while it holds a value
export const isChildHiddenWhenNotRelevant = ({
  cycle,
  record,
  parentNode,
  childDef,
}: {
  cycle: string
  record: any
  parentNode: any
  childDef: any
}): boolean =>
  NodeDefLayout.isHiddenWhenNotRelevant(cycle)(childDef) &&
  !Node.isChildApplicable(childDef.uuid)(parentNode) &&
  !isChildFilledByUser({ record, parentNode, childDefUuid: childDef.uuid })
