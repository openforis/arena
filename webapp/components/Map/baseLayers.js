export const apiKeyToken = '___API_KEY___'

export const baseLayers = [
  {
    key: 'ESRI World Imagery',
    name: 'ESRI World Imagery (satellite)',
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  },
  {
    key: 'ESRI Topographic',
    name: 'ESRI Topographic',
    attribution: 'Esri, CGIAR, USGS | Esri, HERE, Garmin, SafeGraph, FAO, METI/NASA, USGS, EPA, NPS',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}.png',
  },
  {
    key: 'ESRI Terrain',
    name: 'ESRI Terrain',
    attribution: 'Esri, NASA, NGA, USGS | VITA, Esri, HERE, Garmin, SafeGraph, METI/NASA, USGS, EPA, NPS, USDA',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}.png',
  },
  {
    key: 'OpenStreetMap',
    name: 'OpenStreetMap',
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  },
  // Planet Labs maps
  ...['2018_06', '2018_12', '2019_06', '2019_12', '2020_06', '2020_12', '2021_06', '2021_12'].map((period) => ({
    key: `planet_${period}`,
    name: `Planet (${period})`,
    attribution: 'Planet Labs PBC',
    apiKeyRequired: true,
    provider: 'planet',
    url: `https://tiles.planet.com/basemaps/v1/planet-tiles/global_monthly_${period}_mosaic/gmap/{z}/{x}/{y}.png?api_key=${apiKeyToken}`,
  })),
]
