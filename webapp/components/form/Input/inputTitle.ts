/**
 * Returns the title (hover tooltip) of an input: the given one, else the value, so a long value can be read. A
 * password input never shows its value.
 * @param {object} params - Parameters.
 * @param {string|number|null} [params.title] - Title given by the caller.
 * @param {string|number} [params.value] - Value of the input.
 * @param {string} [params.type] - Input type.
 * @returns {string|number|undefined} The title; undefined for none.
 */
export const getInputTitle = ({
  title,
  value,
  type,
}: {
  title?: string | number | null
  value?: string | number
  type?: string
}): string | number | undefined => {
  if (title !== null && title !== undefined) return title
  if (type === 'password') return undefined
  return value === undefined || value === null || value === '' ? undefined : String(value)
}
