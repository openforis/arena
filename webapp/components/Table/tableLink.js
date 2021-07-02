export const getLimit = () => 15

export const getOffset = () => {
  const url = new URL(window.location.href)
  return Number(url.searchParams.get('offset'))
}

export const getLink = ({ limit, offset }) => {
  const url = new URL(window.location.href)
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('offset', String(offset))
  return `${url.pathname}${url.search}`
}
