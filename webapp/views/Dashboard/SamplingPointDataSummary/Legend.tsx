import { useI18n } from '@webapp/store/system'

type LegendProps = {
  colors: any[]
  data: any[]
  totalItems: number
}

export const Legend = (props: LegendProps) => {
  const { colors, data, totalItems } = props

  const i18n = useI18n()

  return (
    <div className="legend">
      <div>{i18n.t('homeView:dashboard.samplingPointDataCompletion.totalItems', { totalItems })}</div>
      {data.map((dataItem, index) => {
        const { name, value } = dataItem
        const percent = Math.floor((value * 100) / totalItems)
        return (
          <div key={name} className="row">
            <span className="square" style={{ backgroundColor: colors[index] }} />
            <span>
              {name}: {value} ({percent}%)
            </span>
          </div>
        )
      })}
    </div>
  )
}
