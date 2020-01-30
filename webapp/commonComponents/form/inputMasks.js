import createNumberMask from 'text-mask-addons/dist/createNumberMask'

const _commonProps = {
  prefix: '',
  suffix: '',
  includeThousandsSeparator: false,
  thousandsSeparatorSymbol: ',',
  allowNegative: true,
  allowLeadingZeroes: true,
  requireDecimal: false,
}

export const integerLimited = integerLimit =>
  createNumberMask({
    ..._commonProps,
    allowDecimal: false,
    ...(integerLimit ? { integerLimit } : {}),
  })

export const integer = integerLimited(null)

export const decimalLimited = (integerLimit, decimalLimit) =>
  createNumberMask({
    ..._commonProps,
    allowDecimal: true,
    decimalSymbol: '.',
    ...(integerLimit ? { integerLimit } : {}),
    ...(decimalLimit ? { decimalLimit } : {}),
  })

export const decimal = decimalLimited(null, null)
