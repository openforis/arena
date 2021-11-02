import countriesData from './countries_data.json'

const getCountries = () => Object.entries(countriesData).reduce((acc, [code, item]) => [...acc, { code, ...item }], [])

export const Countries = {
  list: getCountries,
}
