import { useSelector } from 'react-redux'

import * as SystemInfoState from './state'

export const useSystemAppInfo = () => useSelector(SystemInfoState.getAppInfo)
export const useSystemConfig = () => useSelector(SystemInfoState.getConfig)
export const useSystemConfigFileUploadLimit = () => {
  const { fileUploadLimit } = useSystemConfig()
  return fileUploadLimit
}
export const useSystemConfigFileUploadLimitMB = () => {
  const fileUploadLimit = useSystemConfigFileUploadLimit()
  return fileUploadLimit / 1024 ** 2
}
