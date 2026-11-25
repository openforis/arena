import type { ArenaAnyNodeDef } from '@openforis/arena-core'

import { ViewDataNodeDef } from '@common/model/db'
import * as NodeDef from '@core/survey/nodeDef'
import { ScriptEditor } from '@webapp/components/ScriptEditor'
import { useSurvey } from '@webapp/store/survey'

type AggregateFunctionExpressionEditorProps = {
  expression: string
  entityDef: ArenaAnyNodeDef
  onChange: (...args: any[]) => any
}

export const AggregateFunctionExpressionEditor = (props: AggregateFunctionExpressionEditorProps) => {
  const { expression, entityDef, onChange } = props

  const survey = useSurvey()

  // create entity view column names completer
  const viewDataNodeDef = new ViewDataNodeDef(survey, entityDef)

  const columnItems = viewDataNodeDef.columnNodeDefNames.map((columnName) => ({
    caption: columnName,
    value: columnName,
    meta: `${NodeDef.getName(entityDef)} - Column`,
  }))

  const columnNamesCompleter = {
    getCompletions: (_editor, _session, _pos, _prefix, callback) => {
      callback(null, columnItems)
    },
  }

  return (
    <ScriptEditor
      name="custom_aggregate_function_editor"
      mode="sql"
      script={expression}
      onChange={onChange}
      completer={columnNamesCompleter}
      height="150px"
    />
  )
}
