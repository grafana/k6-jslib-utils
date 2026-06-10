# k6-jslib-utils

A collection of small utility functions useful during load testing with k6.

Docs: https://grafana.com/docs/k6/latest/javascript-api/jslib/utils

Download the latest release from https://jslib.k6.io/

## Example

```javascript
import { sleep } from 'k6'
import http from 'k6/http'

import {
    randomIntBetween,
    randomString,
    randomItem,
    uuidv4,
    findBetween,
} from 'https://jslib.k6.io/k6-utils/1.6.0/index.js'

export default function () {
    let res = http.post(`https://test-api.k6.io/user/register/`, {
        first_name: randomItem(['Joe', 'Jane']), // random name
        last_name: `Jon${randomString(1, 'aeiou')}s`, //random character from given list
        username: `user_${randomString(10)}@example.com`, // random email address,
        password: uuidv4(), // random password in form of uuid
    })

    let username = findBetween(res.body, '"username":"', '"') // grab the username from surrounding strings

    sleep(randomIntBetween(1, 5)) // sleep between 1 and 5 seconds.
}
```

## Development

`src/index.js` is a single self-contained ES module that k6 runs as-is — there is
no build step or Node.js tooling. The tests run directly on the k6 runtime:

```
k6 run tests/findBetween.js
```

### Publish a new version

1. Follow the jslib.k6.io [procedure](https://github.com/grafana/jslib.k6.io#how-to-add-a-new-version-of-a-and-existing-package) for creating a new version.
2. Copy `src/index.js` into the expected folder as `index.js` and open a new PR to [jslib.k6.io](https://github.com/grafana/jslib.k6.io).
