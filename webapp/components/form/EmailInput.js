import React from 'react'

import { SimpleTextInput } from './SimpleTextInput'

const EmailInput = (props) => {
  return <SimpleTextInput {...props} textTransformFunction={(text) => text.toLocaleLowerCase().trim()} />
}

EmailInput.propTypes = {
  ...SimpleTextInput.propTypes,
}

EmailInput.defaultProps = {
  ...SimpleTextInput.defaultProps,
}

export default EmailInput
