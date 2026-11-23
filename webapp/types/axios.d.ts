import 'axios'

declare module 'axios' {
  interface AxiosRequestConfig {
    // the request errors are handled by the caller: the global error interceptor does not show them
    errorHandledLocally?: boolean
  }
}
