export type CollectedRoute = { method: string; path: string; handlers: any[] }

/**
 * Collects the routes registered by an API module (method, path and the whole handler chain), without a server.
 * @param {(app: object) => void} init - The module `init`, called with a fake express app.
 * @returns {CollectedRoute[]} The routes.
 */
export const collectRoutes = (init: (app: any) => void): CollectedRoute[] => {
  const routes: CollectedRoute[] = []
  const app = new Proxy(
    {},
    {
      get:
        (_target, method: string) =>
        (path: string, ...handlers: any[]) => {
          routes.push({ method, path, handlers })
        },
    }
  )
  init(app)
  return routes
}
