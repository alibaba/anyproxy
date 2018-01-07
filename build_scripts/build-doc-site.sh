#!/bin/bash

## get into the "build_scripts" folder regardless of the excution directory
parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path/.."

## compile the doc
node ./build_scripts/prebuild-doc.js
gitbook build ./docs-src ./docs

## push the doc into github
git add ./docs
git commit -m 'building docs'
git push origin
