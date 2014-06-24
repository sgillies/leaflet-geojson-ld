L.GeoJSONLD = L.GeoJSON.extend({

    initialize: function (geojson, options) {
        if (!options.onEachFeature) {
            options.onEachFeature = function(feature, layer) {
                layer.bindPopup('<h3>' + feature.properties.NAME + '</h3>');
            }
        }
        L.setOptions(this, options);
        this._layers = {};
        if (geojson) {
            this.addData(geojson);
    },

    addData: function (geojson) {
        var features = L.Util.isArray(geojson) ? geojson : geojson.features,
            i, len, feature;

        if (features) {
            for (i = 0, len = features.length; i < len; i++) {
                // Only add this if geometry or geometries are set and not null
                feature = features[i];
                if (feature.geometries || feature.geometry || feature.features || feature.coordinates) {
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

L.geoJsonLd = function(data, options){
    return new L.GeoJSONLD(data, options);
}

