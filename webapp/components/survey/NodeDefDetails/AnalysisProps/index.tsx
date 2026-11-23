import AreaBasedEstimated from './AreaBasedEstimated'
import RScriptEditor from './RScriptEditor'
import type { ArenaAnyNodeDef } from '@openforis/arena-core'

type AnalysisPropsProps = {
  state: Record<string, any>
  Actions: Record<string, any>
  nodeDef: ArenaAnyNodeDef
}

const AnalysisProps = (props: AnalysisPropsProps) => {
  const { state, Actions, nodeDef } = props

  return (
    <>
      <AreaBasedEstimated nodeDef={nodeDef} state={state} Actions={Actions} />
      <RScriptEditor nodeDef={nodeDef} state={state} Actions={Actions} />
    </>
  )
}

export default AnalysisProps
