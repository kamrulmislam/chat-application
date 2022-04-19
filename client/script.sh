#!/bin/sh

sed -i "s|__WEBSOCKET_URL__|$WEBSOCKET_URL|g" ./public/index.js
node ./build/app.js