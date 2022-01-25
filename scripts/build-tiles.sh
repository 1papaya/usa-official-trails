#!/bin/bash

rm -rf docs/
mkdir -p docs/

./bin/tippecanoe --drop-densest-as-needed \
    --force \
    --read-parallel \
    --no-tile-compression \
    --output-to-directory="docs/" \
    --maximum-zoom=13 \
    data/usfs-roads.geojson \
    data/usfs-trails.geojson \
    data/nps-trails.geojson \