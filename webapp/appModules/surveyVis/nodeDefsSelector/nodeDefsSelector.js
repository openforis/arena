import React from 'react'

import VariablesSelector from './VariablesSelector'

const NodeDefsSelector = ({onChangeEntity, onChangeAttributes, canSelectAttributes = true}) => (
      <div className="node-defs-selector">

        <VariablesSelector canSelectVariables={canSelectAttributes}
                           onVariablesChange={onChangeAttributes}
                           onTableChange={onChangeEntity}/>


      </div>
    )


export default NodeDefsSelector

