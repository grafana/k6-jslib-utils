import { Rate } from 'k6/metrics'

type CheckValue =
    | Array<unknown>
    | Record<string | number | symbol, unknown>
    | boolean
    | string
    | number
    | null
    | undefined

type Checker<T> =
    | ((value: T) => CheckValue)
    | ((value: T) => Promise<CheckValue>)
    | CheckValue
    | Promise<CheckValue>

interface CheckMap<T> {
    [key: string]: Checker<T>
}

interface SyncCheckMap {
    [key: string]: ((value: any) => CheckValue) | CheckValue
}

type CheckResult<C extends CheckMap<any>> = C extends SyncCheckMap ? boolean : Promise<boolean>

const checkRate = new Rate('checks')

export function check<T, C extends CheckMap<T>>(
    value: T,
    checkers: C,
    tags?: Record<string, string>
): CheckResult<C>
export function check<T, C extends CheckMap<T>>(
    value: Promise<T>,
    checkers: C,
    tags?: Record<string, string>
): Promise<CheckResult<C>>
export function check<T, C extends CheckMap<T>>(
    value: T | Promise<T>,
    checkers: C,
    tags?: Record<string, string>
): CheckResult<C> | Promise<CheckResult<C>> {
    if (value instanceof Promise) {
        return value.then((value) => check(value, checkers, tags)) as Promise<CheckResult<C>>
    }

    const results = Object.entries(checkers).map(([key, checker]) => {
        function reportResult(value: CheckValue): CheckValue {
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
