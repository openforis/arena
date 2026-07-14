import React, { useCallback, useEffect, useState } from 'react'

import { ArrayUtils } from '@core/arrayUtils'
import * as StringUtils from '@core/stringUtils'
import * as UserGroupQualifier from '@core/user/userGroup/userGroupQualifier'
import { validateUserGroupQualifier } from '@core/user/userGroup/userGroupValidator'
import * as Validation from '@core/validation/validation'
import type { ValidationInstance } from '@core/validation/validation'

import { Button, ButtonAdd } from '@webapp/components'
import { FormItem, Input } from '@webapp/components/form/Input'
import { useI18n } from '@webapp/store/system'

/**
 * A single group qualifier: a key/value pair stored inline in the group's props.
 */
export type UserGroupQualifierItem = {
  name: string
  value: string
}

type Props = {
  qualifiers: UserGroupQualifierItem[]
  onChange: (qualifiers: UserGroupQualifierItem[]) => void
  readOnly?: boolean
}

/**
 * Dynamic list editor for a user group's qualifiers (key/value pairs).
 * Every row is validated inline (required key, valid key format, duplicate key detection across the
 * other rows) and bound directly to the parent's single Save button; there is no per-row edit/save/cancel
 * state, unlike `ExtraPropDefEditor`.
 *
 * @param props0 - The component props.
 * @param props0.qualifiers - The qualifiers currently associated with the group.
 * @param props0.onChange - Called with the updated qualifiers array whenever a row is added, edited or removed.
 * @param props0.readOnly - Whether the editor is read-only (add/edit/remove controls are hidden).
 * @returns {React.ReactElement} - The UserGroupQualifiersEditor component.
 */
export const UserGroupQualifiersEditor = (props: Props): React.ReactElement => {
  const { qualifiers, onChange, readOnly = false } = props
  const i18n = useI18n()

  const [validations, setValidations] = useState<ValidationInstance[]>([])

  const validateAll = useCallback(
    (qualifiersToValidate: UserGroupQualifierItem[]): Promise<ValidationInstance[]> =>
      Promise.all(
        qualifiersToValidate.map((qualifier) =>
          validateUserGroupQualifier({ qualifier, qualifiers: qualifiersToValidate })
        )
      ),
    []
  )

  useEffect(() => {
    let ignore = false

    validateAll(qualifiers).then((results) => {
      if (!ignore) {
        setValidations(results)
      }
    })

    return () => {
      ignore = true
    }
  }, [qualifiers, validateAll])

  const updateQualifierAt = (index: number, qualifierUpdated: UserGroupQualifierItem) => {
    const qualifiersUpdated = [...qualifiers]
    qualifiersUpdated[index] = qualifierUpdated
    onChange(qualifiersUpdated)
  }

  const onAdd = () => onChange([...qualifiers, UserGroupQualifier.newQualifier() as UserGroupQualifierItem])

  const onRemove = (index: number) =>
    onChange(ArrayUtils.removeItemAtIndex<UserGroupQualifierItem>({ index })(qualifiers))

  return (
    <div className="user-group-qualifiers-editor">
      {qualifiers.map((qualifier, index) => (
        <FormItem key={index} label={`${i18n.t('usersView:userGroup.qualifiers')} ${index + 1}`}>
          <Input
            placeholder={i18n.t('usersView:userGroup.qualifierKey')}
            readOnly={readOnly}
            value={UserGroupQualifier.getName(qualifier)}
            onChange={(value: string) =>
              updateQualifierAt(
                index,
                UserGroupQualifier.assocName(StringUtils.normalizeName(value))(qualifier) as UserGroupQualifierItem
              )
            }
            validation={Validation.getFieldValidation(UserGroupQualifier.keys.name)(validations[index])}
          />
          <Input
            placeholder={i18n.t('usersView:userGroup.qualifierValue')}
            readOnly={readOnly}
            value={UserGroupQualifier.getValue(qualifier)}
            onChange={(value: string) =>
              updateQualifierAt(index, UserGroupQualifier.assocValue(value)(qualifier) as UserGroupQualifierItem)
            }
          />
          {!readOnly && <Button iconClassName="icon-cross icon-12px" variant="text" onClick={() => onRemove(index)} />}
        </FormItem>
      ))}
      {!readOnly && <ButtonAdd label="usersView:userGroup.addQualifier" onClick={onAdd} />}
    </div>
  )
}
