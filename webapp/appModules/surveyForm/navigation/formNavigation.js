import React from 'react'

import NodeDefNavigation from './nodeDefNavigation'
import FormEntryActions from './formEntryActions'
import FormEditActions from './formEditActions'

const FormNavigation = ({ edit, entry, preview, history, canEditDef }) => {

  return (
    <div className="survey-form__nav">
      <div className="survey-form__nav-node-def-navigation">
        <NodeDefNavigation edit={edit && canEditDef}
                           level={0}/>
      </div>

      {
        edit && canEditDef
          ? <FormEditActions/>
          : <FormEntryActions preview={preview} history={history} entry={entry}/>
      }
    </div>
  )
}

export default FormNavigation