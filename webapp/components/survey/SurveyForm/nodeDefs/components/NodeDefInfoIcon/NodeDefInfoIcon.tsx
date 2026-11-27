import type { ArenaAnyNodeDef } from '@openforis/arena-core'

import * as NodeDef from '@core/survey/nodeDef'
import { AppIcon } from '@webapp/components/AppIcon'

type NodeDefInfoIconProps = {
  lang: string
  nodeDef: ArenaAnyNodeDef
}

export const NodeDefInfoIcon = (props: NodeDefInfoIconProps) => {
  const { lang, nodeDef } = props

  const description = NodeDef.getDescription(lang)(nodeDef)

  if (!description) return null

  return <AppIcon name="info" size={18} title={description} />
}
