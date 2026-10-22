#!/bin/sh
# Builds dist/picklog-interactive-lab.zip and dist/plugin.json from plugin/ (run after any plugin change).
set -e
cd "$(dirname "$0")"
VERSION=$(sed -n "s/.*const VERSION = '\([0-9.]*\)'.*/\1/p" plugin/picklog-interactive-lab/picklog-interactive-pro.php)
mkdir -p dist
rm -f dist/picklog-interactive-lab.zip
(cd plugin && zip -qr -X ../dist/picklog-interactive-lab.zip picklog-interactive-lab -x "*.DS_Store")
cat > dist/plugin.json <<JSON
{"version": "$VERSION", "package": "https://raw.githubusercontent.com/mcc-cmd/picklog-automation/main/dist/picklog-interactive-lab.zip", "changelog": "See README.md"}
JSON
echo "built $VERSION"
