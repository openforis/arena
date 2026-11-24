import countriesData from './countries_data.json'

type CountryItem = {
  name: string
}

type CountryMap = Record<string, CountryItem>

const data = countriesData as CountryMap

const list = Object.entries(data).map(([code, item]) => ({ code, ...item }))

const _getCountry = ({ code }: { code: string }): CountryItem | undefined => data[code]

const getCountryName = ({ code, defaultToCode = true }: { code: string; defaultToCode?: boolean }): string | null => {
  const country = _getCountry({ code })
  if (country) return country.name
  if (defaultToCode) return code
  return null
}

export const Countries = {
  list,
  getCountryName,
}
