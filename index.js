#!/usr/bin/node --experimental-modules

import main from "./src/probiotic.js";

main(process.argv.length, process.argv.slice(1)).then(result => process.exit(result)).catch(e => {
    console.error(e);
    process.exit(1);
});
