#!/bin/bash

trap "trap - SIGTERM && kill -- -$$" SIGINT SIGTERM EXIT

# Finally start the daemons
node ./src/bot/index.js &
node ./src/server/index.js
