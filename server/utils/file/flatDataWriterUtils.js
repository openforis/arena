import * as StringUtils from '@core/stringUtils'

const defaultOptions = { objectTransformer: null, removeNewLines: true }

const defaultObjectTransformer =
  (options = {}) =>
  (obj) => {
    const { removeNewLines = true } = options
    if (!removeNewLines) return obj

    Object.entries(obj).forEach(([key, value]) => {
      obj[key] = StringUtils.removeNewLines(value)
    })
    return obj
  }

export const FlatDataWriterUtils = {
  defaultOptions,
  defaultObjectTransformer,
}
