import { Rate } from 'k6/metrics'

type FalsyCheckValue =
    | Array<unknown>
    | Record<string | number | symbol, unknown>
    | boolean
    | string
    | number
    | null
    | undefined

type Checker<T> =
    | ((value: T) => FalsyCheckValue)
    | ((value: T) => Promise<FalsyCheckValue>)
    | FalsyCheckValue
    | Promise<FalsyCheckValue>

interface CheckMap<T> {
    [key: string]: Checker<T>
}

interface SyncCheckMap {
    [key: string]: ((value: any) => FalsyCheckValue) | FalsyCheckValue
}

type CheckResult<C extends CheckMap<any>> = C extends SyncCheckMap ? boolean : Promise<boolean>

const checkRate = new Rate('checks')

export function check<T, C extends CheckMap<T>>(
    value: T,
    checkers: C,
    tags?: Record<string, string>
): CheckResult<C> {
    const results = Object.entries(checkers).map(([key, checker]) => {
        function reportResult(value: FalsyCheckValue): FalsyCheckValue {
            checkRate.add(
                value ? 1 : 0,
                Object.assign({}, tags, {
                    check: key,
                })
            )

            return value
        }

        if (typeof checker === 'function') {
            const result = checker(value)

            if (result instanceof Promise) {
                return result.then(reportResult)
            }

            return reportResult(result)
        }

        if (checker instanceof Promise) {
            return checker.then(reportResult)
        }

        return reportResult(checker)
    })

    if (results.some((result) => result instanceof Promise)) {
        return Promise.all(results).then((results) => results.every(Boolean)) as CheckResult<C>
    }

    return results.every(Boolean) as CheckResult<C>
}
