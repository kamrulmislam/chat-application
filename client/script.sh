#!/bin/sh

sed -i "s|__WEBSOCKET_URL__|$WEBSOCKET_URL|g" index.js
exec nginx -g 'daemon off;'
