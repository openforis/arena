import * as NodeDef from '@core/survey/nodeDef'
import type { ArenaAnyNodeDef } from '@openforis/arena-core'

type NodeDefInfoIconProps = {
  lang: string
  nodeDef: ArenaAnyNodeDef
}

export const NodeDefInfoIcon = (props: NodeDefInfoIconProps) => {
  const { lang, nodeDef } = props

  const description = NodeDef.getDescription(lang)(nodeDef)

  if (!description) return null

  return <span className="icon icon-info icon-12px" title={description} />
}
