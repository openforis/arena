import NodeDefDetails from '@webapp/components/survey/NodeDefDetails'
import { useChainEditable } from '@webapp/store/ui/chain'

const ChainNodeDefDetails = () => {
  const editable = useChainEditable()

  return <NodeDefDetails readOnly={!editable} />
}

export default ChainNodeDefDetails
