import * as NodeDef from '@core/survey/nodeDef'

import ExpressionEditor from '@webapp/components/expression/ExpressionEditor'
import ValidationTooltip from '@webapp/components/ValidationTooltip'
import type { ArenaAnyNodeDef, ArenaValidation } from '@openforis/arena-core'

type NodeDefSingleExpressionPropProps = {
  canBeConstant?: boolean
  excludeCurrentNodeDef?: boolean
  isBoolean?: boolean
  nodeDef: ArenaAnyNodeDef
  onChange: (...args: any[]) => any
  qualifier: string
  query?: string // String representing the expression
  validation?: ArenaValidation
}

export const NodeDefSingleExpressionProp = (props: NodeDefSingleExpressionPropProps) => {
  const {
    canBeConstant = false,
    excludeCurrentNodeDef = false,
    isBoolean = false,
    nodeDef,
    onChange,
    qualifier,
    query,
    validation = null,
  } = props
  return (
    <div className="node-def-edit__expressions">
      <ValidationTooltip validation={validation} showKeys={false}>
        <div className="node-def-edit__expression">
          <ExpressionEditor
            canBeConstant={canBeConstant}
            excludeCurrentNodeDef={excludeCurrentNodeDef}
            isBoolean={isBoolean}
            isContextParent
            nodeDefUuidContext={NodeDef.getParentUuid(nodeDef)}
            nodeDefUuidCurrent={NodeDef.getUuid(nodeDef)}
            onChange={({ query, callback }) => {
              onChange({ query })
              callback()
            }}
            qualifier={qualifier}
            query={query}
          />
        </div>
      </ValidationTooltip>
    </div>
  )
}
