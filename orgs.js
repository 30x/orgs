'use strict'
const http = require('http')
const https = require('https')
const url = require('url')
const lib = require('http-helper-functions')
const pLib = require('permissions-helper-functions')

const configuredLoginAddress = process.env.APIGEE_LOGIN_ADDRESS
const configuredEdgeAddress = process.env.EDGE_ADDRESS
const clientId = process.env.ORGS_CLIENTID
const clientSecret = process.env.ORGS_CLIENTSECRET

const keyspaceCache = {}

function getOrgInfo(req, res, orgName){
  var user = lib.getUser(req.headers.authorization)
  if (user == null)
    lib.unauthorized(req, res)
  else {
    pLib.ifAllowedThen(req, res, '/v1/o/'+orgName, null, 'read', function(){
      var org = {}
      org.isA = "Org"
      org.id = orgName
      getCpsDetails(orgName, function (err, ring, keyspace, tenantID, customer) {
        if (err)
          lib.internalError(res, err)
        else {
          org.kvmRing = ring
          org.kvmKeyspace = keyspace
          org.tenantID = tenantID
          returnOrg(req, res, org, null)
        }
      })
    })
  }
}


function returnOrg(req, res, org, etag) {
  lib.externalizeURLs(org, req.headers.host)
  lib.found(req, res, org, etag)
}


function getCpsDetails(orgName, callback){

  if (keyspaceCache.hasOwnProperty(orgName)){
    //console.log('Tenant and keyspace found in cache for org: '+orgName)
    callback(null, keyspaceCache[orgName].ring, keyspaceCache[orgName].keyspace, keyspaceCache[orgName].tenantID, keyspaceCache[orgName].customer )
  }
  else {
    var clientAuthEncoded = new Buffer(clientId + ':' + clientSecret).toString('base64')
    var tokenReq = {
      'headers': {
        'authorization': "Basic " + clientAuthEncoded,
        'Accept': "application/json",
        'Content-Type': "application/x-www-form-urlencoded"
      }
    }
    // curl -X POST -u XXXX:XXXX "https://host/oauth/token" -d "grant_type=client_credentials"
    sendExternalRequest(tokenReq, {}, configuredLoginAddress, "/oauth/token", 'POST', 'grant_type=client_credentials', function (clientRes) {
      if (clientRes.statusCode !== 200)
        callback('unable to authenticate')
      else {
        var body = ''
        clientRes.on('data', function (d) {body += d})
        clientRes.on('end', function () {
          var token = JSON.parse(body).access_token
          var tenantReq = {
            'headers': {
              'authorization': "Bearer " + token,
              'Accept': "application/json",
            }
          }
          // curl "https:/host/v1/cps/organizations/{org}/products/edge/tenants" -H "Authorization: Bearer XXXX" -v
          sendExternalRequest(tenantReq, {}, configuredEdgeAddress, "/v1/cps/organizations/" + orgName + "/products/edge/tenants", 'GET', null, function (clientRes) {
            if (clientRes.statusCode !== 200)
              callback('unable to obtain CPS information')
            else {
              var body = ''
              clientRes.on('data', function (d) {body += d})
              clientRes.on('end', function () {
                var responseObj = JSON.parse(body)
                var tenantID = responseObj.id
                var customer = responseObj.customer
                var kvmKeyspace;
                var kvmRing;
                if (responseObj.hasOwnProperty("keyspaces")) {
                  for (var i = 0; i < responseObj.keyspaces.length; i++) {
                    if (responseObj.keyspaces[i].hasOwnProperty("serviceType") && responseObj.keyspaces[i].serviceType === "kvm") {
                      kvmKeyspace = responseObj.keyspaces[i].name
                      kvmRing = responseObj.keyspaces[i].ringName
                    }
                  }
                }
                // put this info in a cache because it's too expensive to fetch every time
                keyspaceCache[orgName] = {
                  keyspace: kvmKeyspace,
                  tenantID: tenantID,
                  ring: kvmRing,
                  customer: customer
                }
                callback(null, kvmRing, kvmKeyspace, tenantID, customer)
              })
            }
          })
        })
      }
    })
  }
}


function requestHandler(req, res) {

  function handleOrgsMethod(orgName) {
    if (req.method == 'GET')
      getOrgInfo(req, res, orgName);
    else
      lib.methodNotAllowed(req, res, ['GET'])
  }


  if (req.url.startsWith('/orgs;'))
    handleOrgsMethod(req.url.split('/orgs;')[1])
  else
    lib.notFound(req, res)
}


function sendExternalRequest(serverReq, res, address, path, method, body, callback) {

  var addressParts = address.toString().split(':')
  var scheme = addressParts[0]
  var host = addressParts[1].replace('//','')
  var useHttps = scheme === 'https'
  //console.log('scheme: '+scheme+', host: '+host+', path: '+path+', method: '+method+', body: '+body)
  var headers = {
    'Accept': 'application/json',
  }
  if (body) {
    headers['Content-Type'] = serverReq.headers['Content-Type'] || 'application/json'
    headers['Content-Length'] = Buffer.byteLength(body)
  }
  if (serverReq.headers.authorization !== undefined)
    headers.authorization = serverReq.headers.authorization

  var options = {
    hostname: host,
    path: path,
    method: method,
    headers: headers,
    rejectUnauthorized: false // TODO make this configurable. used because apigee doesn't generate certs properly
  }
  if (addressParts.length > 2)
    options.port = addressParts[2]

  var clientReq
  if (useHttps)
    clientReq = https.request(options, callback)
  else
    clientReq = http.request(options, callback)

  clientReq.on('error', function (err) {
    console.log(`sendHttpRequest: error ${err}`)
    lib.internalError(res, err)
  })

  if (body) clientReq.write(body)
  clientReq.end()
}


var port = process.env.PORT
function start() {
  http.createServer(requestHandler).listen(port, function () {
    console.log(`server is listening on ${port}`)
  })
}

if (process.env.INTERNAL_SY_ROUTER_HOST == 'kubernetes_host_ip') 
  lib.getHostIPThen(function(err, hostIP){
    if (err) 
      process.exit(1)
    else {
      process.env.INTERNAL_SY_ROUTER_HOST = hostIP
      start()
    }
  })
else 
  start()
