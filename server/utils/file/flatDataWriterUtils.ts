import * as StringUtils from '@core/stringUtils'

export type FlatDataWriterOptions = {
  objectTransformer?: ((obj: Record<string, any>) => Record<string, any>) | null
  removeNewLines?: boolean
}

const defaultOptions: FlatDataWriterOptions = { objectTransformer: null, removeNewLines: true }

const defaultObjectTransformer =
  (options: FlatDataWriterOptions = {}) =>
  (obj: Record<string, any>): Record<string, any> => {
    const { removeNewLines = true } = options
    if (!removeNewLines) return obj

    for (const [key, value] of Object.entries(obj)) {
      obj[key] = StringUtils.removeNewLines(value)
    }
    return obj
  }

export const FlatDataWriterUtils = {
  defaultOptions,
  defaultObjectTransformer,
}
