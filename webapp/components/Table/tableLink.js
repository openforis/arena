export const getLimit = () => 15

export const getOffset = () => {
  const url = new URL(window.location.href)
  return Number(url.searchParams.get('offset'))
}

export const getLink = (offsetLink) => {
  const url = new URL(window.location.href)
  url.searchParams.set('offset', String(offsetLink))
  return `${url.pathname}${url.search}`
}
