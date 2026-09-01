import { createContext, useContext } from 'react'

export const NodeDefEditReadOnlyContext = createContext(false)

export const useNodeDefEditReadOnly = () => useContext(NodeDefEditReadOnlyContext)
