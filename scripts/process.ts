import { pipe, split, map, IterableExt } from "iter-ops";
import mapshaper from "mapshaper";
import fs from "fs";

const rawDataDir = "data/raw";
const outDir = "data";

const geoPipe = (
  inPath: string,
  outPath: string
): Promise<[fs.WriteStream, IterableExt<GeoJSON.Feature>]> =>
  Promise.all([
    // delete output file if exists
    // return write stream
    fs.promises
      .access(outPath)
      .then(() => fs.promises.unlink(outPath))
      .catch(() => {})
      .then(() => fs.createWriteStream(outPath)),
    // read input file into newline delimited json
    // split output buffer by newlines and parse each json feature
    // return geojson feature iterable
    mapshaper
      .applyCommands(
        [
          inPath,
          "-explode",
          "-o format=geojson precision=0.0000001 ndjson out.geojson",
        ].join(" ")
      )
      .then((data: { [key: string]: Buffer }) =>
        // parsing buffer with JSON.parse() hits string size limit
        // create iterable splitting the buffer by newlines & parsing each line
        // thanks to vitaly-t https://stackoverflow.com/a/70159997
        pipe(
          data["out.geojson"],
          split((a) => a === 10),
          map((m) => JSON.parse(Buffer.from(m).toString()))
        )
      ),
  ]);

(async () => {
  //
  // usfs-trails
  //
  geoPipe(
    `${rawDataDir}/S_USA.TrailNFS_Publish.shp`,
    `${outDir}/usfs-trails.geojson`
  ).then(([outStream, features]) => {
    for (let feat of features) {
      if (!feat.geometry) continue; // skip null geometries

      // drop unwanted columns
      const keepColumns = [
        "TRAIL_NO",
        "TRAIL_NAME",
        "TRAIL_CLAS",
        "TRAIL_SURF",
        "ALLOWED_TE",
        "ADMIN_ORG",
        "MANAGING_O",
      ];

      for (const col of Object.keys(feat.properties))
        if (!keepColumns.includes(col)) delete feat.properties[col];

      outStream.write(`${JSON.stringify(feat)}\n`);
    }
  });

  //
  // usfs-roads
  //
  geoPipe(
    `${rawDataDir}/S_USA.RoadCore_FS.shp`,
    `${outDir}/usfs-roads.geojson`
  ).then(([outStream, features]) => {
    for (let feat of features) {
      // skip null geometries
      if (!feat.geometry) continue;

      // drop unwanted columns
      const keepColumns = [
        "NAME",
        "OPER_MAINT",
        "OBJECTIVE_",
        "SURFACE_TY",
        "ADMIN_ORG",
        "MANAGING_O",
      ];

      for (const col of Object.keys(feat.properties))
        if (!keepColumns.includes(col)) delete feat.properties[col];

      // simplify some columns
      feat.properties["SURFACE_TY"] =
        feat.properties["SURFACE_TY"].split(" - ")[0];

      feat.properties["OBJECTIVE_"] =
        feat.properties["OBJECTIVE_"].split(" - ")[0];

      feat.properties["OPER_MAINT"] =
        feat.properties["OPER_MAINT"].split(" - ")[0];

      outStream.write(`${JSON.stringify(feat)}\n`);
    }
  });

  //
  // nps-trails
  //
  geoPipe(
    `${rawDataDir}/NPS_-_Trails_-_Geographic_Coordinate_System.shp`,
    `${outDir}/nps-trails.geojson`
  ).then(([outStream, features]) => {
    for (let feat of features) {
      // skip null geometries
      if (!feat.geometry) continue;

      // drop unwanted columns
      const keepColumns = ["TRLNAME", "TRLALTNAME", "TRLSURFACE", "TRLUSE"];

      for (const col of Object.keys(feat.properties))
        if (!keepColumns.includes(col)) delete feat.properties[col];

      outStream.write(`${JSON.stringify(feat)}\n`);
    }
  });
})();
