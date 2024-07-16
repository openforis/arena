import PropTypes from 'prop-types'

export const CallEditorPropTypes = {
  expressionNode: PropTypes.object,
  onConfirm: PropTypes.func.isRequired,
  variables: PropTypes.array.isRequired,
}
