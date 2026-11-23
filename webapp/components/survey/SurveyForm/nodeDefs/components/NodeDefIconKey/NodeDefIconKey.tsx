import * as NodeDef from '@core/survey/nodeDef'
import type { ArenaAnyNodeDef } from '@openforis/arena-core'

type NodeDefIconKeyProps = {
  nodeDef: ArenaAnyNodeDef
}

const NodeDefIconKey = (props: NodeDefIconKeyProps) => {
  const { nodeDef } = props

  return NodeDef.isKey(nodeDef) && <span className="icon icon-key2 icon-left icon-10px node-def__icon-key" />
}

export default NodeDefIconKey
