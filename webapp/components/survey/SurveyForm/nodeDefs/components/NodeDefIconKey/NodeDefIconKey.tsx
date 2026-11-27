import type { ArenaAnyNodeDef } from '@openforis/arena-core'

import * as NodeDef from '@core/survey/nodeDef'
import { AppIcon } from '@webapp/components/AppIcon'

type NodeDefIconKeyProps = {
  nodeDef: ArenaAnyNodeDef
}

const NodeDefIconKey = (props: NodeDefIconKeyProps) => {
  const { nodeDef } = props

  return NodeDef.isKey(nodeDef) && <AppIcon name="key" size={12} className="icon-left node-def__icon-key" />
}

export default NodeDefIconKey
