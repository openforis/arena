// Segment analytics.js, loaded in the page (if configured)
type SegmentAnalytics = {
  track?: (type: string, properties: object) => void
  page?: (type: string, properties: object) => void
  identify?: (userId: string, traits: object) => void
  _user?: { traits: () => object; id: () => string }
}

const getAnalytics = (): SegmentAnalytics | undefined =>
  (globalThis as typeof globalThis & { analytics?: SegmentAnalytics }).analytics

type TrackParams = { type?: string | false; properties?: object }

const _analytics = ({
  methodName = 'track',
  type = false,
  properties = {},
}: TrackParams & { methodName?: 'track' | 'page' }) => {
  try {
    const method = getAnalytics()?.[methodName]
    if (type && method) {
      method(type, properties)
    }
  } catch {
    // analytics errors are ignored
  }
}

const track = ({ type = false, properties = {} }: TrackParams) => {
  return _analytics({ methodName: 'track', type, properties })
}

const page = ({ type = false, properties = {} }: TrackParams) => {
  return _analytics({ methodName: 'page', type, properties })
}

const identify = ({ userId, properties = {} }: { userId: string; properties?: object }) => {
  const _traits = {
    ...getAnalytics()?._user?.traits(),
    ...properties,
  }
  getAnalytics()?.identify?.(userId, _traits)
}

const getTraits = () => {
  return (
    getAnalytics()?._user?.traits() || (localStorage?.ajs_user_traits ? JSON.parse(localStorage?.ajs_user_traits) : {})
  )
}

const getUserId = () => {
  return getAnalytics()?._user?.id() || (localStorage?.ajs_user_id ? JSON.parse(localStorage?.ajs_user_id) : {})
}

const addTraits = ({ traits = {} }: { traits?: object } = {}) => {
  const _traits = {
    ...getTraits(),
    ...traits,
  }
  getAnalytics()?.identify?.(getUserId(), _traits)
}

export default {
  track,
  page,
  identify,
  addTraits,
  getTraits,
}
