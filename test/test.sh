#!/bin/bash

echo "Begin to run the test suites, JASMINE is required.\n"
echo "Removing test temp directory before running"
rm -rf ./test/temp/*
echo "Removing done, test cases now running"
node -v
jasmine JASMINE_CONFIG_PATH=./jasmine.json
