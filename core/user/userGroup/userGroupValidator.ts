import * as UserGroup from './userGroup'
import * as UserGroupQualifier from './userGroupQualifier'
import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'
import type { ValidatorFn } from '@core/validation/_validator/validatorFunctions'

/**
 * Like `Validator.validateItemPropUniqueness`, but excludes "self" from the comparison by occurrence
 * count rather than by `uuid`. User groups (before being saved) and user group qualifiers (which
 * are plain `{ name, value }` pairs stored inline in the group's props, never assigned a `uuid`) don't
 * have a stable `uuid` to compare against, so the uuid-based exclusion in the shared validator would
 * treat any two distinct uuid-less items as "the same item" and never flag real duplicates.
 *
 * Counting occurrences of the item's own prop value within `items` avoids self-exclusion altogether:
 * as long as `items` includes an entry for `item` itself (by value, not necessarily by object
 * reference), that entry always contributes 1 to the count, so only a genuine duplicate pushes the
 * count to 2 or more. This is correct whether or not `item` is the same object reference as its
 * counterpart in `items` - unlike reference-equality-based self-exclusion, it stays correct even if
 * a caller validates a freshly-constructed/cloned item (e.g. `{ ...qualifier, name: newValue }`)
 * against the list it logically belongs to.
 *
 * @param errorKey - Validation error key to return when a duplicate is found.
 * @returns A function that takes the list of items (including `item` itself) to compare against and
 *   returns a `ValidatorFn`.
 */
const _validateItemPropUniquenessByOccurrenceCount =
  (errorKey: string) =>
  (items: Array<Record<string, unknown>>): ValidatorFn =>
  (propName: string, item: unknown) => {
    const value = Validator.getProp(propName)(item)
    const occurrences = items?.filter((other) => Validator.getProp(propName)(other) === value).length ?? 0
    return occurrences > 1 ? { key: errorKey, params: { name: value } } : null
  }

const _qualifiersAreValid = async (qualifiers: Array<Record<string, unknown>>): Promise<boolean> => {
  const validations = await Promise.all(
    qualifiers.map((qualifier) => validateUserGroupQualifier({ qualifier, qualifiers }))
  )
  return validations.every((validation) => Validation.isValid(validation))
}

export const validateUserGroup = async (
  userGroup: Record<string, unknown>,
  otherGroupsInSurvey: Array<Record<string, unknown>> = []
) => {
  const qualifiers = UserGroup.getQualifiers(userGroup)
  const qualifiersValid = await _qualifiersAreValid(qualifiers)

  return Validator.validate(userGroup, {
    [`${UserGroup.keys.props}.${UserGroup.keysProps.name}`]: [
      Validator.validateRequired(Validation.messageKeys.nameRequired),
      Validator.validateName(Validation.messageKeys.nameInvalid),
      // `otherGroupsInSurvey` excludes the group being validated, but the occurrence-count check
      // relies on `items` including an entry for `item` itself (see helper doc above), so the
      // group being validated is added to the comparison list here.
      _validateItemPropUniquenessByOccurrenceCount(Validation.messageKeys.userGroupEdit.nameDuplicate)([
        ...otherGroupsInSurvey,
        userGroup,
      ]),
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
  qualifiers: Array<Record<string, unknown>>
}) =>
  Validator.validate(qualifier, {
    [UserGroupQualifier.keys.name]: [
      Validator.validateRequired(Validation.messageKeys.userGroupEdit.qualifierNameRequired),
      Validator.validateName(Validation.messageKeys.userGroupEdit.qualifierNameInvalid),
      _validateItemPropUniquenessByOccurrenceCount(Validation.messageKeys.userGroupEdit.qualifierNameDuplicate)(
        qualifiers
      ),
    ],
  })
