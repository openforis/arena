import React from 'react'

import NodeDefNavigation from './nodeDefNavigation'
import FormEntryActions from './formEntryActions'
import FormEditActions from './formEditActions'

const FormNavigation = ({edit, entry}) => {

  return (
    <div className="survey-form__nav">

      <div className="survey-form__nav-node-def-navigation">
        <NodeDefNavigation edit={edit}
                           level={0}/>
      </div>

      {
        edit ?
          <FormEditActions/>
          :
          <FormEntryActions entry={entry}/>
      }
    </div>
  )
}

export default FormNavigation