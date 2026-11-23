import NodeDefUnitFormItem from './NodeDefUnitFormItem'

type IntegerPropsProps = {
  state: Record<string, any>
  Actions: Record<string, any>
}

const IntegerProps = (props: IntegerPropsProps) => {
  const { state, Actions } = props

  return <NodeDefUnitFormItem state={state} Actions={Actions} />
}

export default IntegerProps
