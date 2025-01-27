import * as fs from "fs";

async function main() {
  //
  const devServerTextContent = "";
  fs.writeFileSync(
    "../../../vg-docker/src/+global_consts/config.ts",
    devServerTextContent
  );
}

main();
