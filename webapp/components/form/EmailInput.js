import React from 'react'

import { Input } from './Input'

const EmailInput = (props) => {
  const { name, onChange, placeholder, value } = props

  return (
    <Input
      onChange={onChange}
      type="text"
      name={name}
      placeholder={placeholder}
      textTransformFunction={(text) => text.toLocaleLowerCase().trim()}
      value={value}
    />
  )
}

EmailInput.propTypes = {
  ...Input.propTypes,
}

EmailInput.defaultProps = {
  ...Input.defaultProps,
}

export default EmailInput
