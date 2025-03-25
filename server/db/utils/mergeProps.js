export const mergeProps =
  ({ draft = false } = {}) =>
  (row) => {
    if (!row) {
      return null
    }
    const { props = {}, props_draft: propsDraft = {} } = row
    row['props'] = draft ? Object.assign(props, propsDraft) : props
    delete row['props_draft']
    return row
  }
