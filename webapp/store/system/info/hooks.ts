import { useSelector } from 'react-redux'

import * as SystemInfoState from './state'

export const useSystemAppInfo = () => useSelector(SystemInfoState.getAppInfo)
export const useSystemConfig = () => useSelector(SystemInfoState.getConfig)
export const useSystemConfigExperimentalFeatures = (): boolean =>
  useSelector(SystemInfoState.getConfigExperimentalFeatures)
export const useSystemConfigFileUploadLimit = (): number => useSelector(SystemInfoState.getConfigFileUploadLimit)
export const useSystemConfigFileUploadLimitMB = (): number => useSelector(SystemInfoState.getConfigFileUploadLimitMB)
