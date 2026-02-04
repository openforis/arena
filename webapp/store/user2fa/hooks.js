import { useSelector } from 'react-redux'
import { UserTwoFactorDeviceState } from './state'

export const useUserTwoFactorDevice = () => useSelector((state) => UserTwoFactorDeviceState.getDevice(state))
