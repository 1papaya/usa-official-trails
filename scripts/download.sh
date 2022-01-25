#!/bin/bash

##
## USGS datasets
##

road="S_USA.RoadCore_FS"
trail="S_USA.TrailNFS_Publish"

lyrs=( "$road" "$trail" )

mkdir -p data/raw
cd data/raw

for lyr in "${lyrs[@]}"
do
    echo "${lyr}"
    
    wget --quiet --no-clobber "https://data.fs.usda.gov/geodata/edw/edw_resources/shp/$lyr.zip"
    unzip -qq -n "${lyr}.zip"
done

##
## NPS dataset
##

# https://public-nps.opendata.arcgis.com/datasets/nps::nps-trails-geographic-coordinate-system/

echo "NPS_-_Trails_-_Geographic_Coordinate_System"
wget --quiet --no-clobber --output-document="NPS_-_Trails_-_Geographic_Coordinate_System.zip"
unzip -qq -n "NPS_-_Trails_-_Geographic_Coordinate_System.zip"
