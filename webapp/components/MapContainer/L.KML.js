var L = require('leaflet')

const styleAttributes = new Set(['color', 'width', 'Icon', 'href', 'hotSpot'])
const groundOverlayAttributes = new Set(['Icon', 'href', 'color'])

// KML colors are in aabbggrr format
const parseKmlColor = (value) => ({
  opacity: Number.parseInt(value.substring(0, 2), 16) / 255,
  color: '#' + value.substring(6, 8) + value.substring(4, 6) + value.substring(2, 4),
})

const getFirstChildValue = (e) => (e.childNodes?.length ? e.childNodes[0].nodeValue : null)

const parseStyleHotSpot = (e, options) => {
  for (const attribute of e.attributes) {
    options[attribute.name] = attribute.nodeValue
  }
}

const parseStyleElementValue = ({ e, key, value, options }) => {
  if (key === 'color') {
    Object.assign(options, parseKmlColor(value))
  } else if (key === 'width') {
    options.weight = Number.parseInt(value, 10)
  } else if (key === 'Icon') {
    const iconOptions = parseStyleElement(e)
    if (iconOptions.href) {
      options.href = iconOptions.href
    }
  } else if (key === 'href') {
    options.href = value
  }
}

const parseStyleElement = (xml) => {
  const options = {}
  for (const e of xml.childNodes) {
    const key = e.tagName
    if (!styleAttributes.has(key)) continue

    if (key === 'hotSpot') {
      parseStyleHotSpot(e, options)
    } else {
      const value = getFirstChildValue(e)
      if (value) {
        parseStyleElementValue({ e, key, value, options })
      }
    }
  }
  return options
}

const parseFirstStyleElement = (xml, tagName) => {
  const el = xml.getElementsByTagName(tagName)[0]
  return el ? parseStyleElement(el) : {}
}

const createKmlIcon = (iconStyleOptions, kmlOptions) => {
  const iconOptions = {
    iconUrl: iconStyleOptions.href,
    shadowUrl: null,
    anchorRef: { x: iconStyleOptions.x, y: iconStyleOptions.y },
    anchorType: { x: iconStyleOptions.xunits, y: iconStyleOptions.yunits },
  }
  if (typeof kmlOptions === 'object' && typeof kmlOptions.iconOptions === 'object') {
    L.Util.extend(iconOptions, kmlOptions.iconOptions)
  }
  return new L.KMLIcon(iconOptions)
}

const parseGroundOverlayElement = (xml) => {
  const options = {}
  for (const e of xml.childNodes) {
    const key = e.tagName
    if (!groundOverlayAttributes.has(key)) continue

    const value = e.childNodes[0].nodeValue
    if (key === 'Icon') {
      const iconOptions = parseGroundOverlayElement(e)
      if (iconOptions.href) {
        options.href = iconOptions.href
      }
    } else if (key === 'href') {
      options.href = value
    } else if (key === 'color') {
      Object.assign(options, parseKmlColor(value))
    }
  }
  return options
}

const readTextContent = (el) => {
  let text = ''
  for (const child of el.childNodes) {
    text = text + child.nodeValue
  }
  return text
}

// collects the layers parsed from the specified elements, skipping the ones not accepted by the filter
const collectLayers = ({ elements, parse, filter = null }) => {
  const layers = []
  for (const el of elements) {
    if (filter && !filter(el)) continue
    const layer = parse(el)
    if (layer) {
      layers.push(layer)
    }
  }
  return layers
}

L.KML = L.FeatureGroup.extend({
  initialize: function (kml, kmlOptions) {
    this._kml = kml
    this._layers = {}
    this._kmlOptions = kmlOptions

    if (kml) {
      this.addKML(kml, kmlOptions)
    }
  },

  addKML: function (xml, kmlOptions) {
    const layers = L.KML.parseKML(xml, kmlOptions)
    if (!layers?.length) return
    for (const layer of layers) {
      this.fire('addlayer', { layer })
      this.addLayer(layer)
    }
    this.latLngs = L.KML.getLatLngs(xml)
    this.fire('loaded')
  },

  latLngs: [],
})

L.Util.extend(L.KML, {
  parseKML: function (xml, kmlOptions) {
    const style = this.parseStyles(xml, kmlOptions)
    this.parseStyleMap(xml, style)
    const isTopLevel = (el) => this._check_folder(el)
    return [
      ...collectLayers({
        elements: xml.getElementsByTagName('Folder'),
        parse: (el) => this.parseFolder(el, style),
        filter: isTopLevel,
      }),
      ...collectLayers({
        elements: xml.getElementsByTagName('Placemark'),
        parse: (el) => this.parsePlacemark(el, xml, style),
        filter: isTopLevel,
      }),
      ...collectLayers({
        elements: xml.getElementsByTagName('GroundOverlay'),
        parse: (el) => this.parseGroundOverlay(el),
      }),
    ]
  },

  // Return false if e's first parent Folder is not [folder]
  // - returns true if no parent Folders
  _check_folder: function (e, folder) {
    e = e.parentNode
    while (e && e.tagName !== 'Folder') {
      e = e.parentNode
    }
    return !e || e === folder
  },

  parseStyles: function (xml, kmlOptions) {
    const styles = {}
    for (const styleEl of xml.getElementsByTagName('Style')) {
      const style = this.parseStyle(styleEl, kmlOptions)
      if (style) {
        styles['#' + style.id] = style
      }
    }
    return styles
  },

  parseStyle: function (xml, kmlOptions) {
    const style = parseFirstStyleElement(xml, 'LineStyle')

    const polyOptions = parseFirstStyleElement(xml, 'PolyStyle')
    if (polyOptions.color) {
      style.fillColor = polyOptions.color
    }
    if (polyOptions.opacity) {
      style.fillOpacity = polyOptions.opacity
    }

    const iconStyleOptions = parseFirstStyleElement(xml, 'IconStyle')
    if (iconStyleOptions.href) {
      style.icon = createKmlIcon(iconStyleOptions, kmlOptions)
    }

    const id = xml.getAttribute('id')
    if (id) {
      style.id = id
    }

    return style
  },

  parseStyleMap: function (xml, existingStyles) {
    for (const e of xml.getElementsByTagName('StyleMap')) {
      const keyEl = e.getElementsByTagName('key')[0]
      const styleUrlEl = e.getElementsByTagName('styleUrl')[0]
      if (keyEl?.textContent === 'normal') {
        existingStyles['#' + e.getAttribute('id')] = existingStyles[styleUrlEl?.textContent]
      }
    }
  },

  parseFolder: function (xml, style) {
    const isDirectChild = (el) => this._check_folder(el, xml)
    const layers = [
      ...collectLayers({
        elements: xml.getElementsByTagName('Folder'),
        parse: (el) => this.parseFolder(el, style),
        filter: isDirectChild,
      }),
      ...collectLayers({
        elements: xml.getElementsByTagName('Placemark'),
        parse: (el) => this.parsePlacemark(el, xml, style),
        filter: isDirectChild,
      }),
      ...collectLayers({
        elements: xml.getElementsByTagName('GroundOverlay'),
        parse: (el) => this.parseGroundOverlay(el),
        filter: isDirectChild,
      }),
    ]
    if (!layers.length) {
      return undefined
    }
    const layer = layers.length === 1 ? layers[0] : new L.FeatureGroup(layers)
    const nameEls = xml.getElementsByTagName('name')
    if (nameEls.length && nameEls[0].childNodes.length) {
      layer.options.name = nameEls[0].childNodes[0].nodeValue
    }
    return layer
  },

  _applyPlacemarkStyles: function (place, style, opts) {
    for (const styleUrlEl of place.getElementsByTagName('styleUrl')) {
      const url = styleUrlEl.childNodes[0].nodeValue
      Object.assign(opts, style[url])
    }
    if (place.getElementsByTagName('Style')[0]) {
      const inlineStyle = this.parseStyle(place)
      if (inlineStyle) {
        Object.assign(opts, inlineStyle)
      }
    }
  },

  _parseMultiGeometry: function (place, xml, style, opts) {
    for (const tag of ['MultiGeometry', 'MultiTrack', 'gx:MultiTrack']) {
      for (const el of place.getElementsByTagName(tag)) {
        const layer = this.parsePlacemark(el, xml, style, opts)
        if (layer !== undefined) {
          this.addPlacePopup(place, layer)
          return layer
        }
      }
    }
    return undefined
  },

  parsePlacemark: function (place, xml, style, options) {
    const opts = options || {}

    this._applyPlacemarkStyles(place, style, opts)

    const multiGeometryLayer = this._parseMultiGeometry(place, xml, style, opts)
    if (multiGeometryLayer !== undefined) {
      return multiGeometryLayer
    }

    const layers = []
    for (const tag of ['LineString', 'Polygon', 'Point', 'Track', 'gx:Track']) {
      const parse = this['parse' + tag.replace('gx:', '')]
      layers.push(
        ...collectLayers({ elements: place.getElementsByTagName(tag), parse: (el) => parse.call(this, el, xml, opts) })
      )
    }

    if (!layers.length) {
      return undefined
    }
    const layer = layers.length > 1 ? new L.FeatureGroup(layers) : layers[0]

    this.addPlacePopup(place, layer)
    return layer
  },

  addPlacePopup: function (place, layer) {
    let name
    const nameEls = place.getElementsByTagName('name')
    if (nameEls.length && nameEls[0].childNodes.length) {
      name = nameEls[0].childNodes[0].nodeValue
    }
    let descr = ''
    for (const descrEl of place.getElementsByTagName('description')) {
      descr = descr + readTextContent(descrEl)
    }

    if (name) {
      layer.bindPopup('<h2>' + name + '</h2>' + descr, { className: 'kml-popup' })
    }
  },

  parseCoords: function (xml) {
    const el = xml.getElementsByTagName('coordinates')
    return this._read_coords(el[0])
  },

  parseLineString: function (line, xml, options) {
    const coords = this.parseCoords(line)
    if (!coords.length) {
      return undefined
    }
    return new L.Polyline(coords, options)
  },

  parseTrack: function (line, xml, options) {
    let el = xml.getElementsByTagName('gx:coord')
    if (el.length === 0) {
      el = xml.getElementsByTagName('coord')
    }
    let coords = []
    for (const coordEl of el) {
      coords = coords.concat(this._read_gxcoords(coordEl))
    }
    if (!coords.length) {
      return undefined
    }
    return new L.Polyline(coords, options)
  },

  parsePoint: function (line, xml, options) {
    const el = line.getElementsByTagName('coordinates')
    if (!el.length) {
      return undefined
    }
    const ll = el[0].childNodes[0].nodeValue.split(',')
    return new L.KMLMarker(new L.LatLng(ll[1], ll[0]), options)
  },

  _parseBoundaries: function (line, tagName) {
    const boundaries = []
    for (const boundaryEl of line.getElementsByTagName(tagName)) {
      const coords = this.parseCoords(boundaryEl)
      if (coords) {
        boundaries.push(coords)
      }
    }
    return boundaries
  },

  parsePolygon: function (line, xml, options) {
    const polys = this._parseBoundaries(line, 'outerBoundaryIs')
    const inner = this._parseBoundaries(line, 'innerBoundaryIs')
    if (!polys.length) {
      return undefined
    }
    if (options.fillColor) {
      options.fill = true
    }
    if (polys.length === 1) {
      return new L.Polygon(polys.concat(inner), options)
    }
    return new L.MultiPolygon(polys, options)
  },

  getLatLngs: function (xml) {
    let coords = []
    for (const coordsEl of xml.getElementsByTagName('coordinates')) {
      // text might span many childNodes
      coords = coords.concat(this._read_coords(coordsEl))
    }
    return coords
  },

  _read_coords: function (el) {
    const coords = []
    for (const coordText of readTextContent(el).split(/\s+/)) {
      const ll = coordText.split(',')
      if (ll.length >= 2) {
        coords.push(new L.LatLng(ll[1], ll[0]))
      }
    }
    return coords
  },

  _read_gxcoords: function (el) {
    const text = el.firstChild.nodeValue.split(' ')
    return [new L.LatLng(text[1], text[0])]
  },

  parseGroundOverlay: function (xml) {
    const latlonbox = xml.getElementsByTagName('LatLonBox')[0]
    const getBoxValue = (tagName) => latlonbox.getElementsByTagName(tagName)[0].childNodes[0].nodeValue
    const bounds = new L.LatLngBounds(
      [getBoxValue('south'), getBoxValue('west')],
      [getBoxValue('north'), getBoxValue('east')]
    )
    const options = parseGroundOverlayElement(xml)
    if (latlonbox.getElementsByTagName('rotation')[0] !== undefined) {
      options.rotation = Number.parseFloat(getBoxValue('rotation'))
    }
    return new L.RotatedImageOverlay(options.href, bounds, { opacity: options.opacity, angle: options.rotation })
  },
})

L.KMLIcon = L.Icon.extend({
  options: {
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  },
  _setIconStyles: function (img, name) {
    L.Icon.prototype._setIconStyles.apply(this, [img, name])
  },
  _createImg: function (src, el) {
    el = el || document.createElement('img')
    el.onload = this.applyCustomStyles.bind(this, el)
    el.src = src
    return el
  },
  applyCustomStyles: function (img) {
    var options = this.options
    var width = options.iconSize[0]
    var height = options.iconSize[1]

    this.options.popupAnchor = [0, -0.83 * height]
    if (options.anchorType.x === 'fraction') img.style.marginLeft = -options.anchorRef.x * width + 'px'
    if (options.anchorType.y === 'fraction') img.style.marginTop = -(1 - options.anchorRef.y) * height + 1 + 'px'
    if (options.anchorType.x === 'pixels') img.style.marginLeft = -options.anchorRef.x + 'px'
    if (options.anchorType.y === 'pixels') img.style.marginTop = options.anchorRef.y - height + 1 + 'px'
  },
})

L.KMLMarker = L.Marker.extend({
  options: {
    icon: new L.KMLIcon.Default(),
  },
})

// Inspired by https://github.com/bbecquet/Leaflet.PolylineDecorator/tree/master/src
L.RotatedImageOverlay = L.ImageOverlay.extend({
  options: {
    angle: 0,
  },
  _reset: function () {
    L.ImageOverlay.prototype._reset.call(this)
    this._rotate()
  },
  _animateZoom: function (e) {
    L.ImageOverlay.prototype._animateZoom.call(this, e)
    this._rotate()
  },
  _rotate: function () {
    if (L.DomUtil.TRANSFORM) {
      // use the CSS transform rule if available
      this._image.style[L.DomUtil.TRANSFORM] += ' rotate(' + this.options.angle + 'deg)'
    } else if (L.Browser.ie) {
      // fallback for IE6, IE7, IE8
      var rad = this.options.angle * (Math.PI / 180),
        costheta = Math.cos(rad),
        sintheta = Math.sin(rad)
      this._image.style.filter +=
        " progid:DXImageTransform.Microsoft.Matrix(sizingMethod='auto expand', M11=" +
        costheta +
        ', M12=' +
        -sintheta +
        ', M21=' +
        sintheta +
        ', M22=' +
        costheta +
        ')'
    }
  },
  getBounds: function () {
    return this._bounds
  },
})
