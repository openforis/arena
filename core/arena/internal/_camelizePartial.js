import { _curry2 } from './_curry2'

const _camelCase = (str) => str.replace(/[_.-](\w|$)/g, (_, x) => x.toUpperCase())

const _walk = ({ object, skip = [], limitToLevel = null }) => {
  if (!object || !(object instanceof Object) || object instanceof Date || object instanceof RegExp) {
    return object
  }
  if (Array.isArray(object)) {
    return object.map((item) => _walk({ object: item, limitToLevel }))
  }
  const nextLimitToLevel = limitToLevel ? limitToLevel - 1 : null

  return Object.entries(object).reduce((objAcc, [key, value]) => {
    const skipped = skip.includes(key)
    const keyTransformed = skipped ? key : _camelCase(key)
    const valueTranformed =
      skipped || nextLimitToLevel === 0 ? value : _walk({ object: value, limitToLevel: nextLimitToLevel })
    objAcc[keyTransformed] = valueTranformed
    return objAcc
  }, {})
}

/**
 * Recursively transform the keys of the specified object to camel-case.
 *
 * @param {object} [params={}] - The camelize parameters.
 * @param {Array} [params.skip=[]] - An optional list of keys to skip.
 * @param {number} [params.limitToLevel=null] - If specified, camelizes the object prop names only down to the specified level.
 *
 * @returns {any} - The object with keys in camel case or the value in camel case.
 */
export const _camelizePartial = _curry2(({ skip = [], limitToLevel = null } = {}, object) => {
  if (typeof object === 'string' || object instanceof String) {
    return _camelCase(object)
  }
  return _walk({ object, skip, limitToLevel })
})
