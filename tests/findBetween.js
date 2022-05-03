import { check } from 'k6'

import { findBetween } from '../src/utils.js'

export const options = {
    vus: 1,
    iterations: 1,
    thresholds: {
        checks: ['rate==1.00'],
    },
}

export default function main() {
    const content = '<html><div>Value 1</div><div>Value 2</div><div>Value 3</div></html>'
    const divsOnly = '<div>Value 1</div><div>Value 2</div><div>Value 3</div>'

    check(null, {
        single: () => findBetween(content, '<div>', '</div>') === 'Value 1',
        repeat: () => findBetween(content, '<div>', '</div>', true).length === 3,
        'single-with-repeat': () => findBetween(content, '<html>', '</html>', true) == divsOnly,
        'single-with-repeat-array': () =>
            findBetween(content, '<html>', '</html>', true)[0] == divsOnly,
        'no-match-left': () => findBetween(content, '<nodiv>', '</div>') === null,
        'no-match-right': () => findBetween(content, '<div>', '</nodiv>') === null,
        'no-match-both': () => findBetween(content, '<nodiv>', '</nodiv>') === null,
        messy: () => findBetween('let token="secret token";', 'token="', '"') === 'secret token',
        exact: () => findBetween('**a**', '**', '**') === 'a',
    })
}
