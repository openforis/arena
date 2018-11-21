import React from 'react'

import NodeDefNavigation from './nodeDefNavigation'
import RecordActions from './recordActions'

const FormNavigation = ({edit, entry}) => {

  return (
    <div className="survey-form__nav">

      <div className="survey-form__nav-node-def-navigation">
        <NodeDefNavigation edit={edit}
                           level={0}/>
      </div>

      <RecordActions entry={entry}/>

    </div>
  )
}

export default FormNavigation