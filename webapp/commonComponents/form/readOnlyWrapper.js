import React from 'react'

const ReadOnlyWrapper = ({readOnly, children}) =>
  !readOnly ? (children) : null

export default ReadOnlyWrapper
