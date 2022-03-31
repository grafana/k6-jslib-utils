import { check } from 'k6';

import { randomString } from '../src/utils.js'

export default function () {
  const charset = 'abcdefghijklmnopqrstuvwxyz';

  let result = randomString(5, 'abc');
  console.log(`randomString(5, 'abc'): ${result}`)

  check(result, {
    'randomString(5, "abc") is 5 chars long': (r) => r.length === 5,
    'randomString(5, "abc") contains only chars from "abc"': (r) => r.match(/^[abc]+$/),
  });

  result = randomString(5, 'a');
  console.log(`randomString(5, 'a'): ${result}`)

  check(result, {
    'randomString(5, "a") is 5 chars long': (r) => r.length === 5,
    'randomString(5, "a") is "aaaaa"': (r) => r === 'aaaaa',
  });

  result = randomString(10, charset);
  console.log(`randomString(10, 'abcdefghijklmnopqrstuvwxyz'): ${result}`)

  check(result, {
    'randomString(10, "abcdefghijklmnopqrstuvwxyz") is 10 chars long': (r) => r.length === 10,
    'randomString(10, "abcdefghijklmnopqrstuvwxyz") contains only chars from "abcdefghijklmnopqrstuvwxyz"': (r) => r.match(/^[abcdefghijklmnopqrstuvwxyz]+$/),
  });

  result = randomString(8);
  console.log(`randomString(8): ${result}`);

  check(result, {
    'randomString(8) is 8 chars long': (r) => r.length === 8,
    'randomString(8) contains only chars from default charset "abcdefghijklmnopqrstuvwxyz"': (r) => r.match(/^[abcdefghijklmnopqrstuvwxyz]+$/),
  });

  result = randomString(4, "abcde1234");
  console.log(`randomString(4, 'abcde1234'): ${result}`)

  check(result, {
    'randomString(4, "abcde1234") is 4 chars long': (r) => r.length === 4,
    'randomString(4, "abcde1234") contains only chars from "abcde1234"': (r) => r.match(/^[abcde1234]+$/),
  });

  //special chars
  result = randomString(6, "!@#$%^&*()");
  console.log(`randomString(1, '!@#$%^&*()'): ${result}`)

  check(result, {
    'randomString(6, "!@#$%^&*()") is 6 chars long': (r) => r.length === 6,
    'randomString(6, "!@#$%^&*()") contains only chars from "!@#$%^&*()"': (r) => r.match(/^[!@#$%^&*()]+$/),
  });


}
