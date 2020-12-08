export const mergeProps = ({ draft = false } = {}) => (row) => {
  if (!row) {
    return null
  }
  const { props = {}, props_draft: propsDraft = {}, ...rest } = row
  const propsUpdate = draft ? { ...(props || {}), ...(propsDraft || {}) } : props
  return { ...(rest || {}), props: propsUpdate }
}
