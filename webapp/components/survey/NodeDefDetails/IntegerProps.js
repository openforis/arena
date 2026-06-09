import PropTypes from 'prop-types'

import NodeDefUnitFormItem from './NodeDefUnitFormItem'

const IntegerProps = (props) => {
  const { state, Actions } = props

  return <NodeDefUnitFormItem state={state} Actions={Actions} />
}

IntegerProps.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default IntegerProps
