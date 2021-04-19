import { check } from 'k6';

import { findBetween } from '../src/utils.js'

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    checks: ['rate==1.00'],
  }  
}


export default function main() {

  check(null, {
    'simple': () => findBetween('some text {{data}} XX', '{{', '}}') === "data",
    'double': () => findBetween('some text {{data1}} {{data2}} XX', '{{', '}}') === "data1",
    'messy': () => findBetween('let token="secret token";', 'token="', '"') === "secret token",
    'exact': () => findBetween('**a**', '**', '**') === "a",
    'no match': () => findBetween('some text', '{{', '}}') === "",
  });

}

