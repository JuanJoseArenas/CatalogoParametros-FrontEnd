#!/bin/sh
set -eu

config_file=/usr/share/nginx/html/assets/security-config.json
application_name=${SECURITY_APPLICATION_NAME:-Catalogo}
pdp_url=${SECURITY_PDP_URL:-http://localhost:18080}

# El Compose de laboratorio puede montar este archivo como config de solo
# lectura. En ese caso ya contiene el valor correcto y no se debe sobrescribir.
if [ -w "$config_file" ]; then
  cat > "$config_file" <<EOF
{
  "pdpUrl": "$pdp_url",
  "securityUiUrl": "/security-ui/security-administration.js",
  "applicationName": "$application_name"
}
EOF
fi
