# Sample survey polygons (Rome area)

Use these with a published survey that has a **Geo** attribute.

## Multiple map polygons (recommended)

1. Create **3 records**.
2. On each record’s geo attribute, upload one file:
   - `plot-a.geojson`
   - `plot-b.geojson`
   - `plot-c.geojson`
3. Open `/app/dashboard` — the map section should show three separate polygons (and three cluster points).

## One record, three shapes

Upload `plots-abc.geojson` (a FeatureCollection) into a single geo attribute. You get three polygons under one record/cluster.

Coordinates are WGS84 `[longitude, latitude]` near Rome so they sit on the default satellite basemap.
