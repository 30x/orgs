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

def main():
    
    print 'sending requests to %s' % BASE_URL

    # GET orgs;ayesha
    orgs_url = urljoin(BASE_URL, '/orgs;ayesha')
    headers = {'Accept': 'application/json'}
    r = requests.get(orgs_url, headers=headers)
    if r.status_code == 200:
        print 'correctly received org information %s' % r.content
    else:
        print 'failed to get org information for url %s %s %s' % (orgs_url, r.status_code, r.text)
        return

    return

if __name__ == '__main__':
    main()