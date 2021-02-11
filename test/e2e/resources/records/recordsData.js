import * as NodeDef from '@core/survey/nodeDef'
import * as DateUtils from '@core/dateUtils'
import { above } from '../../utils/api'

const countryRelativeSelectors = () => above('Region')

const Cluster = ({
  clusterId = '',
  clusterDecimal = '',
  clusterDate = '',
  clusterTime = '',
  clusterBoolean = '',
  clusterCoordinate = { x: '', y: '', srs: '' },
}) => [
  { type: NodeDef.nodeDefType.integer, value: clusterId, label: 'Cluster id' },
  { type: NodeDef.nodeDefType.decimal, value: clusterDecimal, label: 'Cluster decimal' },
  { type: NodeDef.nodeDefType.date, value: clusterDate, label: 'Cluster date' },
  { type: NodeDef.nodeDefType.time, value: clusterTime, label: 'Cluster time' },
  { type: NodeDef.nodeDefType.boolean, value: clusterBoolean, label: 'Cluster boolean' },
  {
    type: NodeDef.nodeDefType.coordinate,
    x: clusterCoordinate.x,
    y: clusterCoordinate.y,
    srs: clusterCoordinate.srs,
    value: {
      x: clusterCoordinate.x,
      y: clusterCoordinate.y,
      srs: clusterCoordinate.srs,
    },
    label: 'Cluster coordinate',
  },
]
const Plot = ({ plotId, plotText, plotCountry, plotRegion, plotProvince }) => [
  { type: NodeDef.nodeDefType.integer, value: plotId, label: 'Plot id' },
  { type: NodeDef.nodeDefType.text, value: plotText, label: 'Plot text' },

  {
    type: NodeDef.nodeDefType.code,
    value: plotCountry,
    label: 'Country',
    relativeSelectors: [countryRelativeSelectors],
  },
  { type: NodeDef.nodeDefType.code, value: plotRegion, label: 'Region' },
  { type: NodeDef.nodeDefType.code, value: plotProvince, label: 'Province' },
]

export const recordInitial = () => ({
  cluster: Cluster({
    clusterDecimal: 1,
    clusterDate: DateUtils.formatDateISO(new Date()),
    clusterTime: DateUtils.format(new Date(), DateUtils.formats.timeStorage),
    clusterBoolean: 'false',
  }),
})

export const records = [
  {
    cluster: Cluster({
      clusterId: 1,
      clusterDecimal: 10,
      clusterDate: '2021-01-01',
      clusterTime: '10:30',
      clusterBoolean: 'true',
      clusterCoordinate: { x: 10, y: 15, srs: 'GCS WGS 1984 (EPSG:4326)' },
    }),
    plots: [
      Plot({
        plotId: 1,
        plotText: 'text',
        plotCountry: 'Country',
        plotRegion: 'Region 01',
        plotProvince: 'District 0102',
      }),
      Plot({
        plotId: 2,
        plotText: 'text',
        plotCountry: 'Country',
        plotRegion: 'Region 02',
        plotProvince: 'District 0203',
      }),
    ],
  },
  {
    cluster: Cluster({
      clusterId: 2,
      clusterDecimal: 20,
      clusterDate: '2021-01-01',
      clusterTime: '12:30',
      clusterBoolean: 'true',
      clusterCoordinate: { x: 10, y: 15, srs: 'GCS WGS 1984 (EPSG:4326)' },
    }),
    plots: [
      Plot({
        plotId: 1,
        plotText: 'text',
        plotCountry: 'Country',
        plotRegion: 'Region 01',
        plotProvince: 'District 0102',
      }),
      Plot({
        plotId: 2,
        plotText: 'text',
        plotCountry: 'Country',
        plotRegion: 'Region 02',
        plotProvince: 'District 0203',
      }),
    ],
  },
  {
    cluster: Cluster({
      clusterId: 3,
      clusterDecimal: 30,
      clusterDate: '2021-01-01',
      clusterTime: '13:30',
      clusterBoolean: 'true',
      clusterCoordinate: { x: 10, y: 15, srs: 'GCS WGS 1984 (EPSG:4326)' },
    }),
    plots: [
      Plot({
        plotId: 1,
        plotText: 'text',
        plotCountry: 'Country',
        plotRegion: 'Region 01',
        plotProvince: 'District 0102',
      }),
      Plot({
        plotId: 2,
        plotText: 'text',
        plotCountry: 'Country',
        plotRegion: 'Region 02',
        plotProvince: 'District 0203',
      }),
    ],
  },
  {
    cluster: Cluster({
      clusterId: 4,
      clusterDecimal: 40,
      clusterDate: '2021-01-01',
      clusterTime: '14:30',
      clusterBoolean: 'true',
      clusterCoordinate: { x: 10, y: 15, srs: 'GCS WGS 1984 (EPSG:4326)' },
    }),
    plots: [
      Plot({
        plotId: 1,
        plotText: 'text',
        plotCountry: 'Country',
        plotRegion: 'Region 01',
        plotProvince: 'District 0102',
      }),
      Plot({
        plotId: 2,
        plotText: 'text',
        plotCountry: 'Country',
        plotRegion: 'Region 02',
        plotProvince: 'District 0203',
      }),
    ],
  },
  {
    cluster: Cluster({
      clusterId: 5,
      clusterDecimal: 50,
      clusterDate: '2021-01-01',
      clusterTime: '15:30',
      clusterBoolean: 'true',
      clusterCoordinate: { x: 10, y: 15, srs: 'GCS WGS 1984 (EPSG:4326)' },
    }),
    plots: [
      Plot({
        plotId: 1,
        plotText: 'text',
        plotCountry: 'Country',
        plotRegion: 'Region 01',
        plotProvince: 'District 0102',
      }),
      Plot({
        plotId: 2,
        plotText: 'text',
        plotCountry: 'Country',
        plotRegion: 'Region 02',
        plotProvince: 'District 0203',
      }),
    ],
  },
]
