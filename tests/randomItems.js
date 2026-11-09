import { check } from 'k6'
import { SharedArray } from 'k6/data'
import { randomItems } from '../src/index.js'

export const options = {
    vus: 1,
    iterations: 1,
    thresholds: {
        checks: ['rate==1.00'],
    },
}

function throwsTypeError(fn, expectedMessage) {
    try {
        fn()
        return false
    } catch (e) {
        return e instanceof TypeError && (!expectedMessage || e.message === expectedMessage)
    }
}

// SharedArray must be initialized in the init context (top-level)
const sharedData = new SharedArray('test-shared-array', () => [
    { id: 1, name: 'one' },
    { id: 2, name: 'two' },
    { id: 3, name: 'three' },
    { id: 4, name: 'four' },
])

export default function () {
    const original = ['alpha', 'beta', 'gamma', 'delta', 'epsilon']
    const originalBackup = [...original]

    // 1. Quantidade de itens retornados e retorno em array mesmo para count = 1
    const oneItem = randomItems(original, 1)
    check(oneItem, {
        'count = 1 returns an Array': (res) => Array.isArray(res),
        'count = 1 returns exactly 1 item': (res) => res.length === 1,
        'item returned exists in original array': (res) => original.includes(res[0]),
    })

    const threeItems = randomItems(original, 3)
    check(threeItems, {
        'count = 3 returns an Array': (res) => Array.isArray(res),
        'count = 3 returns exactly 3 items': (res) => res.length === 3,
        'count = 3 items all exist in original array': (res) =>
            res.every((item) => original.includes(item)),
    })

    // 2. Garantia de que são itens únicos (sem repetição)
    const largePool = Array.from({ length: 50 }, (_, i) => `item_${i}`)
    const sampledPool = randomItems(largePool, 25)
    check(sampledPool, {
        'sampled 25 items has length 25': (res) => res.length === 25,
        'sampled 25 items are all unique': (res) => new Set(res).size === 25,
        'sampled items are all from original pool': (res) =>
            res.every((item) => largePool.includes(item)),
    })

    // 3. Truncamento de count decimal (Math.floor)
    const floatCountItems = randomItems(original, 2.8)
    check(floatCountItems, {
        'count = 2.8 is floored to 2 items': (res) => res.length === 2,
        'count = 2.8 items are unique': (res) => new Set(res).size === 2,
    })

    // 4. Clamp quando count > length
    const clampedItems = randomItems(original, 100)
    check(clampedItems, {
        'count > length clamps to original.length': (res) => res.length === original.length,
        'clamped items contains all original items': (res) =>
            original.every((item) => res.includes(item)),
        'clamped items are all unique': (res) => new Set(res).size === original.length,
    })

    // 5. Retorno vazio para count <= 0 ou array vazio
    const zeroCount = randomItems(original, 0)
    const negativeCount = randomItems(original, -3)
    const emptyArrayResult = randomItems([], 5)
    const emptyArrayAndZero = randomItems([], 0)

    check(null, {
        'count = 0 returns empty array': () => Array.isArray(zeroCount) && zeroCount.length === 0,
        'count < 0 returns empty array': () =>
            Array.isArray(negativeCount) && negativeCount.length === 0,
        'empty array returns empty array': () =>
            Array.isArray(emptyArrayResult) && emptyArrayResult.length === 0,
        'empty array and count = 0 returns empty array': () =>
            Array.isArray(emptyArrayAndZero) && emptyArrayAndZero.length === 0,
    })

    // 6. Não mutação do array original
    check(original, {
        'original array length is preserved': (arr) => arr.length === originalBackup.length,
        'original array contents and order are untouched': (arr) =>
            arr.every((val, idx) => val === originalBackup[idx]),
    })

    // 7. Suporte a k6 SharedArray
    const sharedSample = randomItems(sharedData, 2)
    check(sharedSample, {
        'works with SharedArray and returns 2 items': (res) => res.length === 2,
        'items from SharedArray are unique': (res) =>
            res[0].id !== res[1].id && new Set(res.map((x) => x.id)).size === 2,
    })

    // 8. Lançamento de TypeError para parâmetros inválidos
    check(null, {
        'throws TypeError on null arrayOfItems': () =>
            throwsTypeError(
                () => randomItems(null, 2),
                'arrayOfItems must be an Array or ArrayLike object'
            ),
        'throws TypeError on undefined arrayOfItems': () =>
            throwsTypeError(
                () => randomItems(undefined, 2),
                'arrayOfItems must be an Array or ArrayLike object'
            ),
        'throws TypeError on number arrayOfItems': () =>
            throwsTypeError(
                () => randomItems(123, 2),
                'arrayOfItems must be an Array or ArrayLike object'
            ),
        'throws TypeError on object without length': () =>
            throwsTypeError(
                () => randomItems({}, 2),
                'arrayOfItems must be an Array or ArrayLike object'
            ),
        'throws TypeError on non-number count (string)': () =>
            throwsTypeError(() => randomItems(original, '2'), 'count must be a number'),
        'throws TypeError on NaN count': () =>
            throwsTypeError(() => randomItems(original, NaN), 'count must be a number'),
        'throws TypeError on undefined count': () =>
            throwsTypeError(() => randomItems(original, undefined), 'count must be a number'),
        'throws TypeError on null count': () =>
            throwsTypeError(() => randomItems(original, null), 'count must be a number'),
    })
}
