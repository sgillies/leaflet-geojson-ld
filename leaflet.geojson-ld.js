L.GeoJSON_LD = L.GeoJSON.extend({
    initialize: function (options) {
        L.GeoJSON.prototype.initialize.call(this, {features:[]}, options);
    }
});

L.geoJsonLd = function(a,b){
    return new L.GeoJSON_LD(a,b);
}

