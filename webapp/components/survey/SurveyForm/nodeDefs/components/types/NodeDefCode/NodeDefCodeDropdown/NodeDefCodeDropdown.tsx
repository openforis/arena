import * as A from '@core/arena'

import { Objects, type ArenaAnyNodeDef } from '@openforis/arena-core'

import * as NodeDef from '@core/survey/nodeDef'

import { TestId } from '@webapp/utils/testId'
import { useI18n } from '@webapp/store/system'
import InputChips from '@webapp/components/form/InputChips'
import Dropdown from '@webapp/components/form/Dropdown'

type NodeDefCodeDropdownProps = {
  canEditRecord?: boolean
  edit?: boolean
  entryDataQuery?: boolean
  itemLabelFunction: (...args: any[]) => any
  items: any[] | ((...args: any[]) => any)
  nodeDef: ArenaAnyNodeDef
  onItemAdd: (...args: any[]) => any
  onItemRemove: (...args: any[]) => any
  readOnly?: boolean
  selectedItems?: Record<string, any>[]
}

const NodeDefCodeDropdown = (props: NodeDefCodeDropdownProps) => {
  const {
    canEditRecord = false,
    edit = false,
    entryDataQuery = false,
    itemLabelFunction,
    items,
    nodeDef,
    onItemAdd,
    onItemRemove,
    readOnly = false,
    selectedItems = [],
  } = props

  const i18n = useI18n()

  const autocomplete = typeof items === 'function'
  const entryDisabled = edit || !canEditRecord || readOnly

  const disabled = A.isEmpty(items)
  const minCharactersToAutocomplete = autocomplete ? 1 : 0

  return (
    <div className="survey-form__node-def-code">
      {NodeDef.isMultiple(nodeDef) && !edit && !entryDataQuery ? (
        <InputChips
          readOnly={entryDisabled}
          items={items}
          disabled={disabled}
          itemKey="uuid"
          itemLabel={itemLabelFunction}
          minCharactersToAutocomplete={minCharactersToAutocomplete}
          selection={selectedItems}
          onItemAdd={onItemAdd}
          onItemRemove={onItemRemove}
        />
      ) : (
        <Dropdown
          disabled={disabled}
          itemValue="uuid"
          itemLabel={itemLabelFunction}
          items={items}
          minCharactersToAutocomplete={minCharactersToAutocomplete}
          onChange={(item) => {
            // NB: onItemRemove is not possible?
            if (item) onItemAdd(item)
            else onItemRemove(item)
          }}
          placeholder={autocomplete ? i18n.t('surveyForm:nodeDefCode.typeCodeOrLabel') : undefined}
          readOnly={entryDisabled}
          selection={Objects.isEmpty(selectedItems) ? null : A.head(selectedItems)}
          testId={TestId.surveyForm.codeInputDropdown(NodeDef.getName(nodeDef))}
        />
      )}
    </div>
  )
}

export default NodeDefCodeDropdown
