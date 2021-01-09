import * as NodeDef from '@core/survey/nodeDef'
import { above } from '../../utils/api'

const countryRelativeSelectors = () => above('Region')

const Cluster = ({ clusterId, clusterDecimal, clusterTime, clusterBoolean, clusterCoordinate }) => [
  { type: NodeDef.nodeDefType.integer, value: clusterId, label: 'Cluster id' },
  { type: NodeDef.nodeDefType.decimal, value: clusterDecimal, label: 'Cluster decimal' },
  // { type: NodeDef.nodeDefType.date, value: '20/11/2020', label: 'Cluster date' },
  { type: NodeDef.nodeDefType.time, value: clusterTime, label: 'Cluster time' },
  { type: NodeDef.nodeDefType.boolean, value: clusterBoolean, label: 'Cluster boolean' },
  {
    type: NodeDef.nodeDefType.coordinate,
    x: clusterCoordinate.x,
    y: clusterCoordinate.y,
    srs: clusterCoordinate.srs,
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

export const records = [
  {
    cluster: Cluster({
      clusterId: 1,
      clusterDecimal: 10,
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
