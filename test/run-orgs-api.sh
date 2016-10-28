export IPADDRESS="127.0.0.1"
export PORT=3010
export COMPONENT="orgs"
export SPEEDUP=10
export EXTERNAL_SY_ROUTER_HOST="localhost"
export EXTERNAL_SY_ROUTER_PORT="8080"
export INTERNAL_SY_ROUTER_HOST="localhost"
export INTERNAL_SY_ROUTER_PORT="8080"
export EDGE_ADDRESS="https://api.e2e.apigee.net"
export APIGEE_LOGIN_ADDRESS="https://login.e2e.apigee.net"
export ORGS_CLIENTID=${ORGS_CLIENTID:-defaultclient} # configure this in your shell when testing
export ORGS_CLIENTSECRET=${ORGS_CLIENTSECRET:-defaultsecret} # configure this in your shell when testing

node orgs.js