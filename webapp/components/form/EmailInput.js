import React from 'react'

import { TextInput } from './TextInput'

const EmailInput = (props) => {
  return <TextInput {...props} textTransformFunction={(text) => text.toLocaleLowerCase().trim()} />
}

EmailInput.propTypes = {
  ...TextInput.propTypes,
}

EmailInput.defaultProps = {
  ...TextInput.defaultProps,
}

export default EmailInput
