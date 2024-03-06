import { _camelizePartial } from './internal/_camelizePartial'

/**
 * Recursively transform the keys of the specified object to camel-case.
 *
 * @param {!object} [params={}] - The camelize parameters.
 * @param {Array} [params.skip=[]] - An optional list of keys to skip.
 * @param {number} [params.limitToLevel=null] - If specified, camelizes the object prop names only down to the specified level.
 * @param {boolean} [params.sideEffect=false] - Whether to do side-effect on the specified object.
 * @returns {any} - The object with keys in camel case or the value in camel case.
 */
export const camelizePartial = _camelizePartial
