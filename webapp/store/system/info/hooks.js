import { useSelector } from 'react-redux'

import * as SystemInfoState from './state'

export const useSystemAppInfo = () => useSelector(SystemInfoState.getAppInfo)
export const useSystemConfig = () => useSelector(SystemInfoState.getConfig)
export const useSystemConfigExperimentalFeatures = () => useSelector(SystemInfoState.getConfigExperimentalFeatures)
export const useSystemConfigFileUploadLimit = () => useSelector(SystemInfoState.getConfigFileUploadLimit)
export const useSystemConfigFileUploadLimitMB = () => useSelector(SystemInfoState.getConfigFileUploadLimitMB)
