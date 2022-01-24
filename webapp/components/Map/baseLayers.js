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
]
