import { SimpleTextInput, type SimpleTextInputProps } from './SimpleTextInput'

const EmailInput = (props: SimpleTextInputProps) => {
  return <SimpleTextInput {...props} textTransformFunction={(text) => text.toLocaleLowerCase().trim()} />
}

export default EmailInput
