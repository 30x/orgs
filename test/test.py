import requests
import base64
import json
from os import environ as env
from urlparse import urljoin

EXTERNAL_SCHEME = env['EXTERNAL_SCHEME']
BASE_URL = '%s://%s:%s' % (EXTERNAL_SCHEME, env['EXTERNAL_SY_ROUTER_HOST'], env['EXTERNAL_SY_ROUTER_PORT']) if 'EXTERNAL_SY_ROUTER_PORT' in env else '%s://%s' % (EXTERNAL_SCHEME, env['EXTERNAL_SY_ROUTER_HOST'])

def b64_decode(data):
    missing_padding = (4 - len(data) % 4) % 4
    if missing_padding:
        data += b'='* missing_padding
    return base64.decodestring(data)

if 'APIGEE_TOKEN1' in env:
    TOKEN1 = env['APIGEE_TOKEN1']
else:
    with open('token.txt') as f:
        TOKEN1 = f.read()
claims = json.loads(b64_decode(TOKEN1.split('.')[1]))
USER1 = claims['iss'] + '#' + claims['sub']

if 'APIGEE_TOKEN2' in env:
    TOKEN2 = env['APIGEE_TOKEN2']
else:
    with open('token2.txt') as f:
        TOKEN2 = f.read()
claims = json.loads(b64_decode(TOKEN2.split('.')[1]))
USER2 = claims['iss'] + '#' + claims['sub']

if 'APIGEE_TOKEN3' in env:
    TOKEN3 = env['APIGEE_TOKEN3']
else:
    with open('token3.txt') as f:
        TOKEN3 = f.read()
claims = json.loads(b64_decode(TOKEN2.split('.')[1]))
USER2 = claims['iss'] + '#' + claims['sub']

def main():
    
    print 'sending requests to %s' % BASE_URL

    # GET orgs;ayesha
    orgs_url = urljoin(BASE_URL, '/orgs;ayesha')
    headers = {'Authorization': 'Bearer %s' % TOKEN1, 'Accept': 'application/json'}
    r = requests.get(orgs_url, headers=headers)
    if r.status_code == 200:
        print 'correctly received org information %s' % r.content
    else:
        print 'failed to get org information for url %s %s %s' % (orgs_url, r.status_code, r.text)
        return

    return

if __name__ == '__main__':
    main()