import countriesData from './countries_data.json'

const list = () => Object.entries(countriesData).reduce((acc, [code, item]) => [...acc, { code, ...item }], [])

const _getCountry = ({ code }) => countriesData[code]

const getCountryName = ({ code, defaultToCode = true }) => _getCountry({ code })?.name || code

export const Countries = {
  list,
  getCountryName,
}
