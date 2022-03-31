# k6-jslib-utils
A collection of small utility functions useful during load testing with k6.

Docs: http://k6.io/docs/javascript-api/jslib/utils

Download the latest release from https://jslib.k6.io/


## Example

```javascript
import { sleep } from 'k6';
import http from 'k6/http';

import { randomIntBetween,
         randomString,
         randomItem,
         uuidv4,
         findBetween } from "./src/utils.js";

export default function() {

  let res = http.post(`https://test-api.k6.io/user/register/`, {
    first_name: randomItem(['Joe', 'Jane']), // random name
    last_name: `Jon${randomString(1,'aeiou')}s`, //random character from given list
    username: `user_${randomString(10)}@example.com`,  // random email address,
    password: uuidv4() // random password in form of uuid
  });

  let username = findBetween(res.body, '"username":"', '"'); // grab the username from surrounding strings

  sleep(randomIntBetween(1, 5)); // sleep between 1 and 5 seconds.
}
```
