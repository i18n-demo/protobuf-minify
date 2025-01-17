#!/usr/bin/env bash

DIR=$(realpath $0) && DIR=${DIR%/*}
cd $DIR
set -ex

if [ ! -d "node_modules" ]; then
  pnpm i
fi

cd proto

$DIR/node_modules/protoscript/dist/cli/index.js

mv _.pb.js ../protoscript.gen.js

$DIR/node_modules/@3-/protoscript/dist/cli/index.js

mv _.pb.js ../protoscript.gen@3-.js

cd ..

mise exec -- ./minify.coffee
./size.js

bun x mdt .
