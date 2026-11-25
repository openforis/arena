import './ExtraPropDefsEditor.scss'

import { ExtraPropDef } from '@core/survey/extraPropDef'
import { ButtonAdd, Markdown } from '@webapp/components'
import { useI18n } from '@webapp/store/system'

import { ExtraPropDefEditor } from './ExtraPropDefEditor'
import { useExtraPropDefsEditor } from './useExtraPropDefsEditor'

type ExtraPropDefsEditorProps = {
  availableDataTypes?: any[]
  canAdd?: boolean
  extraPropDefs: any[]
  infoTextKey?: string
  isExtraPropDefReadOnly?: (...args: any[]) => any
  onExtraPropDefDelete: (...args: any[]) => any
  onExtraPropDefUpdate: (...args: any[]) => any
}

export const ExtraPropDefsEditor = (props: ExtraPropDefsEditorProps) => {
  const {
    availableDataTypes = Object.keys(ExtraPropDef.dataTypes),
    canAdd = true,
    extraPropDefs: extraPropDefsProp,
    infoTextKey = null,
    isExtraPropDefReadOnly = null,
    onExtraPropDefDelete,
    onExtraPropDefUpdate,
  } = props

  const i18n = useI18n()

  const { extraPropDefs, readOnly, onItemAdd, onItemDelete, onItemUpdate } = useExtraPropDefsEditor({
    extraPropDefs: extraPropDefsProp,
    onExtraPropDefDelete,
    onExtraPropDefUpdate,
  })

  return (
    <div className="extra-prop-defs-editor">
      {infoTextKey && <Markdown source={i18n.t(infoTextKey)} />}
      <div className="items-container">
        {extraPropDefs.map((extraPropDef, index) => (
          <ExtraPropDefEditor
            key={extraPropDef.uuid}
            availableDataTypes={availableDataTypes}
            extraPropDef={extraPropDef}
            extraPropDefs={extraPropDefs}
            index={index}
            readOnly={readOnly || isExtraPropDefReadOnly?.(extraPropDef)}
            onItemDelete={onItemDelete}
            onItemUpdate={onItemUpdate}
          />
        ))}
      </div>
      {canAdd && (
        <ButtonAdd
          className="item-add-btn"
          disabled={readOnly || extraPropDefs.some((item) => item.newItem)}
          onClick={onItemAdd}
        />
      )}
    </div>
  )
}
