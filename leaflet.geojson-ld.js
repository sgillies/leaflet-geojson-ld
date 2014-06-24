
var baseContext = {
    "Feature": "http://ld.geojson.org/vocab#Feature",
    "FeatureCollection": "http://ld.geojson.org/vocab#FeatureCollection",
    "GeometryCollection": "http://ld.geojson.org/vocab#GeometryCollection",
    "LineString": "http://ld.geojson.org/vocab#LineString",
    "MultiLineString": "http://ld.geojson.org/vocab#MultiLineString",
    "MultiPoint": "http://ld.geojson.org/vocab#MultiPoint",
    "MultiPolygon": "http://ld.geojson.org/vocab#MultiPolygon",
    "Point": "http://ld.geojson.org/vocab#Point",
    "Polygon": "http://ld.geojson.org/vocab#Polygon",
    "bbox": {
      "@container": "@list",
      "@id": "http://ld.geojson.org/vocab#bbox"
    },
    "coordinates": "http://ld.geojson.org/vocab#coordinates",
    "datetime": "http://www.w3.org/2006/time#inXSDDateTime",
    "description": "http://purl.org/dc/terms/description",
    "features": {
      "@container": "@set",
      "@id": "http://ld.geojson.org/vocab#features"
    },
    "geometry": "http://ld.geojson.org/vocab#geometry",
    "id": "@id",
    "properties": "http://ld.geojson.org/vocab#properties",
    "start": "http://www.w3.org/2006/time#hasBeginning",
    "stop": "http://www.w3.org/2006/time#hasEnding",
    "title": "http://purl.org/dc/terms/title",
    "type": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
    "when": "http://ld.geojson.org/vocab#when"
}

L.GeoJSONLD = L.GeoJSON.extend({

    initialize: function (geojson, options) {
        if (options === undefined) {
            options = {};
        }
        if (!options.onEachFeature) {
            options.onEachFeature = function(feature, layer) {
                layer.bindPopup('<h3>' + feature.properties.LABEL + '</h3>');
            }
        }
        L.setOptions(this, options);
        this._layers = {};
        if (geojson) {
            geojson['@context'] = baseContext;
            this.addData(jsonld.expand(geojson, function(err, expanded) { return expanded; });
        }
    },

    addData: function (geojson) {
        var features = L.Util.isArray(geojson) ? geojson : geojson['http://ld.geojson.org/vocab#features'],
            i, len, feature;

        if (features) {
            for (i = 0, len = features.length; i < len; i++) {
                // Only add this if geometry or geometries are set and not null
                feature = features[i];
                if (feature.geometries || feature['http://ld.geojson.org/vocab#geometry'] || feature['http://ld.geojson.org/vocab#features'] || feature['http://ld.geojson.org/vocab#coordinates']) {
                    this.addData(feature);
                }
            }
            return this;
        }

        var options = this.options;

        if (options.filter && !options.filter(geojson)) { return; }

        var layer = L.GeoJSON.geometryToLayer(geojson, options);
        layer.feature = L.GeoJSON.asFeature(geojson);

        layer.defaultOptions = layer.options;
        this.resetStyle(layer);

        if (options.onEachFeature) {
            options.onEachFeature(geojson, layer);
        }

        return this.addLayer(layer);
    },
});

L.extend(L.GeoJSONLD, {
    geometryToLayer: function (geojson, options) {

        var geometry = geojson['http://www.w3.org/1999/02/22-rdf-syntax-ns#type'] === 'http://ld.geojson.org/vocab#Feature' || geojson['@type'] === 'http://ld.geojson.org/vocab#Feature' ? geojson['http://ld.geojson.org/vocab#geometry'] : geojson,
            coords = geometry['http://ld.geojson.org/vocab#coordinates'],
            layers = [],
            pointToLayer = options && options.pointToLayer,
            coordsToLatLng = options && options.coordsToLatLng || this.coordsToLatLng,
            latlng, latlngs, i, len;

        var geom_type = geometry['@type'] || geometry['http://www.w3.org/1999/02/22-rdf-syntax-ns#type']
        switch (geom_type) {
        case 'http://ld.geojson.org/vocab#Point':
            latlng = coordsToLatLng(coords);
            return pointToLayer ? pointToLayer(geojson, latlng) : new L.Marker(latlng);

        case 'http://ld.geojson.org/vocab#MultiPoint':
            for (i = 0, len = coords.length; i < len; i++) {
                latlng = coordsToLatLng(coords[i]);
                layers.push(pointToLayer ? pointToLayer(geojson, latlng) : new L.Marker(latlng));
            }
            return new L.FeatureGroup(layers);

        case 'http://ld.geojson.org/vocab#LineString':
        case 'http://ld.geojson.org/vocab#MultiLineString':
            latlngs = this.coordsToLatLngs(coords, geometry['@type'] === 'http://ld.geojson.org/vocab#LineString' ? 0 : 1, coordsToLatLng);
            return new L.Polyline(latlngs, options);

        case 'http://ld.geojson.org/vocab#Polygon':
        case 'http://ld.geojson.org/vocab#MultiPolygon':
            latlngs = this.coordsToLatLngs(coords, geometry['@type'] === 'http://ld.geojson.org/vocab#Polygon' ? 1 : 2, coordsToLatLng);
            return new L.Polygon(latlngs, options);

        case 'http://ld.geojson.org/vocab#GeometryCollection':
            for (i = 0, len = geometry['http://ld.geojson.org/vocab#geometries'].length; i < len; i++) {

                layers.push(this.geometryToLayer({
                    'http://ld.geojson.org/vocab#geometry': geometry['http://ld.geojson.org/vocab#geometries'][i],
                    '@type': 'http://ld.geojson.org/vocab#Feature',
                    'http://ld.geojson.org/vocab#properties': geojson['http://ld.geojson.org/vocab#properties']
                }, options));
            }
            return new L.FeatureGroup(layers);

        default:
            throw new Error('Invalid GeoJSON object.');
        }
    },

    getFeature: function (layer, newGeometry) {
        return layer.feature ?
                L.extend({}, layer.feature, {geometry: newGeometry}) :
                L.GeoJSONLD.asFeature(newGeometry);
    },

    asFeature: function (geoJSON) {
        if (geoJSON['@type'] === 'http://ld.geojson.org/vocab#Feature' || geoJSON['http://www.w3.org/1999/02/22-rdf-syntax-ns#type'] === 'http://ld.geojson.org/vocab#Feature') {
            return geoJSON;
        }

        return {
            '@type': 'http://ld.geojson.org/vocab#Feature',
            'http://ld.geojson.org/vocab#properties': {},
            'http://ld.geojson.org/vocab#geometry': geoJSON
        };
    }
});

L.geoJsonLd = function(data, options){
    return new L.GeoJSONLD(data, options);
}

