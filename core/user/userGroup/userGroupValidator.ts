import * as UserGroup from './userGroup'
import * as UserGroupQualifier from './userGroupQualifier'
import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'
import type { ValidatorFn } from '@core/validation/_validator/validatorFunctions'

/**
 * Like `Validator.validateItemPropUniqueness`, but excludes "self" from the comparison by object
 * reference rather than by `uuid`. User groups (before being saved) and user group qualifiers (which
 * are plain `{ name, value }` pairs stored inline in the group's props, never assigned a `uuid`) don't
 * have a stable `uuid` to compare against, so the uuid-based exclusion in the shared validator would
 * treat any two distinct uuid-less items as "the same item" and never flag real duplicates.
 *
 * @param errorKey - Validation error key to return when a duplicate is found.
 * @returns A function that takes the list of items to compare against and returns a `ValidatorFn`.
 */
const _validateItemPropUniquenessByReference =
  (errorKey: string) =>
  (items: Array<Record<string, unknown>>): ValidatorFn =>
  (propName: string, item: unknown) => {
    const value = Validator.getProp(propName)(item)
    const hasDuplicates = items.some((other) => other !== item && Validator.getProp(propName)(other) === value)
    return hasDuplicates ? { key: errorKey } : null
  }

const _qualifiersAreValid = async (qualifiers: Array<Record<string, unknown>>): Promise<boolean> => {
  const validations = await Promise.all(
    qualifiers.map((qualifier) => validateUserGroupQualifier({ qualifier, qualifiers }))
  )
  return validations.every((validation) => Validation.isValid(validation))
}

export const validateUserGroup = async (userGroup: Record<string, unknown>, otherGroupsInSurvey: object[] = []) => {
  const qualifiers = UserGroup.getQualifiers(userGroup)
  const qualifiersValid = await _qualifiersAreValid(qualifiers)

  return Validator.validate(userGroup, {
    [`${UserGroup.keys.props}.${UserGroup.keysProps.name}`]: [
      Validator.validateRequired(Validation.messageKeys.nameRequired),
      Validator.validateName(Validation.messageKeys.nameInvalid),
      _validateItemPropUniquenessByReference(Validation.messageKeys.userGroupEdit.nameDuplicate)(otherGroupsInSurvey),
    ],
    [`${UserGroup.keys.props}.${UserGroup.keysProps.qualifiers}`]: [
      () => (qualifiersValid ? null : { key: Validation.messageKeys.userGroupEdit.qualifiersInvalid }),
    ],
  })
}

export const validateUserGroupQualifier = async ({
  qualifier,
  qualifiers,
}: {
  qualifier: Record<string, unknown>
  qualifiers: object[]
}) =>
  Validator.validate(qualifier, {
    [UserGroupQualifier.keys.name]: [
      Validator.validateRequired(Validation.messageKeys.userGroupEdit.qualifierNameRequired),
      Validator.validateName(Validation.messageKeys.userGroupEdit.qualifierNameInvalid),
      _validateItemPropUniquenessByReference(Validation.messageKeys.userGroupEdit.qualifierNameDuplicate)(qualifiers),
    ],
  })
