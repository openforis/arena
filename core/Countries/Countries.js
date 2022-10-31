import countriesData from './countries_data.json'

const list = Object.entries(countriesData).map(([code, item]) => ({ code, ...item }))

const _getCountry = ({ code }) => countriesData[code]

const getCountryName = ({ code, defaultToCode = true }) => {
  const country = _getCountry({ code })
  if (country) return country.name
  if (defaultToCode) return code
  return null
}

export const Countries = {
  list,
  getCountryName,
}
