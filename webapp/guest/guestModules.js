export const loginModuleUri = module => `/guest/${module.path}/`

// ==== Guest modules
export const guestModules = {
  resetForgotPassword: {
    key: 'resetForgotPassword',
    path: 'resetForgotPassword',
  },
}

export const isResetForgotPasswordUri = uri => uri === loginModuleUri(guestModules.resetForgotPassword)
