import React from 'react'
import PropTypes from 'prop-types'

import AreaBasedEstimated from './AreaBasedEstimated'
import RScriptEditor from './RScriptEditor'

const AnalysisProps = (props) => {
  const { state, Actions, nodeDef } = props

  return (
    <>
      <AreaBasedEstimated nodeDef={nodeDef} state={state} Actions={Actions} />
      <RScriptEditor nodeDef={nodeDef} state={state} Actions={Actions} />
    </>
  )
}

AnalysisProps.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
  nodeDef: PropTypes.object.isRequired,
}

export default AnalysisProps
