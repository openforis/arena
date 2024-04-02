import React from 'react'
import Chip from '@mui/material/Chip'

import * as NodeDef from '@core/survey/nodeDef'
import { Query } from '@common/model/query'
import { useNodeDefsByUuids, useSurveyPreferredLang } from '@webapp/store/survey'

export const DataQuerySelectedAttributes = (props) => {
  const { nodeDefLabelType, query } = props

  const lang = useSurveyPreferredLang()
  const queryAttributeDefs = useNodeDefsByUuids(Query.getAttributeDefUuids(query))

  return (
    <div style="data-query__selected-attributes">
      {queryAttributeDefs.map((attributeDef) => (
        <Chip
          key={NodeDef.getUuid(attributeDef)}
          label={NodeDef.getLabelWithType({ nodeDef: attributeDef, lang, type: nodeDefLabelType })}
          variant="outlined"
        />
      ))}
    </div>
  )
}
