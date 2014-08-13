A GeoJSON-LD Plugin for Leaflet
===============================

This is a substitute for Leaflet's existing GeoJSON layer. It adds layer data 
based the JSON-LD expanded form of the provided GeoJSON, looking for, e.g., a list
of map features in 'http://ld.geojson.org/vocab#features' instead of 'features'.

The jsonld.js library requires a modification so that it doesn't flatten nested 
lists of coordinates. Nested lists aren't supported in JSON-LD, but the library
has no option for passing such data through.

The plugin is developed in this repository's gh-pages branch.
