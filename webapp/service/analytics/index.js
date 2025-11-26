import ReactGA from 'react-ga4'

const gaMeasurementId = 'G-08YPKWTSF0'

const init = ({ user }) => {
  identify({ userId: user?.uuid, properties: user })
  ReactGA.initialize(gaMeasurementId)
}

/* eslint-disable no-undef */

const _analytics = ({ methodName = 'track', type = false, properties = {} }) => {
  try {
    const method = window?.analytics?.[methodName]
    if (type && method) {
      method(type, properties)
    }
  } catch (error) {
    //console.log(error)
  }
}

const track = ({ type = false, properties = {} }) => {
  return _analytics({ methodName: 'track', type, properties })
}

const page = ({ type = false, properties = {} }) => {
  return _analytics({ methodName: 'page', type, properties })
}

const identify = ({ userId, properties = {} }) => {
  const _traits = {
    ...(window?.analytics?._user?.traits() || {}),
    ...properties,
  }
  window?.analytics?.identify(userId, _traits)
}

const getTraits = () => {
  return (
    window?.analytics?._user?.traits() ||
    (localStorage?.ajs_user_traits ? JSON.parse(localStorage?.ajs_user_traits) : {})
  )
}

const getUserId = () => {
  return window?.analytics?._user?.id() || (localStorage?.ajs_user_id ? JSON.parse(localStorage?.ajs_user_id) : {})
}

const addTraits = ({ traits = {} } = {}) => {
  const _traits = {
    ...getTraits(),
    ...traits,
  }
  window?.analytics.identify(getUserId(), _traits)
}

const event = ({ name, params }) => {
  const eventParams = {
    category: 'User',
    ...params,
  }
  ReactGA.event(name, eventParams)
}

export default {
  init,
  track,
  page,
  identify,
  addTraits,
  getTraits,
  event,
}
