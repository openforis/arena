import { ServiceRegistry, ServiceType } from '@openforis/arena-core'

const generateToken = ({ userUuid, fileName }) => {
  const serviceRegistry = ServiceRegistry.getInstance()
  const authTokenService = serviceRegistry.getService(ServiceType.userAuthToken)
  return authTokenService.createDownloadAuthToken({ userUuid, fileName })
}

export const DownloadAuthTokenUtils = {
  generateToken,
}
