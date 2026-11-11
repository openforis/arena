import * as NodeDef from '@core/survey/nodeDef'
import SystemError, { StatusCodes } from '@core/systemError'
import * as Validation from '@core/validation/validation'

// node def names are used as SQL identifiers (data tables and views), in R scripts and in file names: only these
// characters are allowed when saving; the full name format (e.g. the first letter) is checked by the survey validation
const nameCharsRegex = /^[a-z0-9_]*$/

const nodeDefTypes: unknown[] = Object.values(NodeDef.nodeDefType)

/**
 * Throws a bad request error if the props contain a node def name with characters not allowed in names.
 * @param props - The node def props (published or draft) to check.
 */
export const checkNodeDefProps = (props: Record<string, unknown> | null | undefined): void => {
  const name = props?.[NodeDef.propKeys.name]
  if (name !== undefined && name !== null && (typeof name !== 'string' || !nameCharsRegex.test(name))) {
    throw new SystemError(Validation.messageKeys.nodeDefEdit.nameInvalid, { name }, StatusCodes.BAD_REQUEST)
  }
}

/**
 * Throws a bad request error if the node def type is not a known one.
 * @param type - The node def type to check.
 */
export const checkNodeDefType = (type: unknown): void => {
  if (!nodeDefTypes.includes(type)) {
    throw new SystemError('nodeDefTypeInvalid', { type }, StatusCodes.BAD_REQUEST)
  }
}

/**
 * Throws a bad request error if the node def has an unknown type or a name with characters not allowed in names.
 * @param nodeDef - The node def to check (published and draft props).
 */
export const checkNodeDef = (nodeDef: any): void => {
  checkNodeDefType(NodeDef.getType(nodeDef))
  checkNodeDefProps(NodeDef.getProps(nodeDef))
  checkNodeDefProps(NodeDef.getPropsDraft(nodeDef))
}
