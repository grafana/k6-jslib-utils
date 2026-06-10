import { randomBytes } from 'k6/crypto'
import exec from 'k6/execution'
import { Rate } from 'k6/metrics'

// ============================================================================
// check
// ============================================================================

const checkRate = new Rate('checks')

function check(value, checkers, tags) {
    if (value instanceof Promise) {
        return value.then((value) => check(value, checkers, tags))
    }

    const results = Object.entries(checkers).map(([key, checker]) => {
        function reportResult(value) {
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
        return Promise.all(results).then((results) => results.every(Boolean))
    }

    return results.every(Boolean)
}

// ============================================================================
// stages
// ============================================================================

// parseDuration parses the provided string as an Integer number
// in millisecond precision
function parseDuration(str) {
    if (str == null || str.length < 1) {
        throw new Error('str is empty')
    }

    // the sum in millisecond of the parsed duration
    let d = 0

    // current contains the partial seen number
    // it's reset when a time unit is found
    let current = ''

    // it tracks the seen time units
    // and it denies eventual duplicated
    let seen = {}

    for (let i = 0; i < str.length; i++) {
        // append the current char if it's a number or a decimal separator
        if (isNumber(str[i]) || str[i] == '.') {
            current += str[i]
        }

        // return if the next char is not a time unit
        if (str[i + 1] == null || isNumber(str[i + 1]) || str[i + 1] == '.') {
            continue
        }

        let v = parseFloat(current, 10)
        let next = str[i + 1]

        switch (next) {
            case 'd':
                d += v * 24 * 60 * 60 * 1000
                break
            case 'h':
                d += v * 60 * 60 * 1000
                break
            case 'm':
                if (i + 2 < str.length && str[i + 2] == 's') {
                    // millisecond is the maximum precision
                    // truncate eventual decimal
                    d += Math.trunc(v)
                    i++
                    next = 'ms'
                } else {
                    d += v * 60 * 1000
                }
                break
            case 's':
                d += v * 1000
                break
            default:
                throw new Error(`${next} is an unsupported time unit`)
        }
        if (seen[next]) {
            throw new Error(`${next} time unit is provided multiple times`)
        }
        seen[next] = true
        i++
        current = ''
    }
    // flush in case no time unit has been provided
    // for the latest group
    if (current.length > 0) {
        d += parseFloat(current, 10)
    }
    return d
}

// isNumber return true if the c character is a number
function isNumber(c) {
    return c >= '0' && c <= '9'
}

// getCurrentStageIndex returns the computed index of the running stage.
function getCurrentStageIndex() {
    let scenario = exec.test.options.scenarios[exec.scenario.name]
    if (scenario == null) {
        throw new Error(
            `the exec.test.options object doesn't contain the current scenario ${exec.scenario.name}`
        )
    }
    if (scenario.stages == null) {
        throw new Error(
            `only ramping-vus or ramping-arravial-rate supports stages, it is not possible to get a stage index on other executors.`
        )
    }

    if (scenario.stages.length < 1) {
        throw new Error(`the current scenario ${scenario.name} doesn't contain any stage`)
    }

    let sum = 0
    let elapsed = new Date() - exec.scenario.startTime
    for (let i = 0; i < scenario.stages.length; i++) {
        sum += parseDuration(scenario.stages[i].duration)
        if (elapsed < sum) {
            return i
        }
    }

    return scenario.stages.length - 1
}

// tagWithCurrentStageIndex adds a tag with a `stage` key
// and the index of the current running stage as value.
function tagWithCurrentStageIndex() {
    exec.vu.tags['stage'] = getCurrentStageIndex()
}

// tagWithCurrentStageProfile adds a tag with a `stage` key
// and the profile (ramp-up, steady or ramp-down) computed
// from the current running stage.
function tagWithCurrentStageProfile() {
    //ramp-up when previous.target < current.target
    //ramp-down when previous.target > current.target
    //steady when prevuious.target = current.target

    let getStageProfile = function () {
        let currentIndex = getCurrentStageIndex()
        if (currentIndex < 1) {
            return 'ramp-up'
        }

        let stages = exec.test.options.scenarios[exec.scenario.name].stages
        let current = stages[currentIndex]
        let previous = stages[currentIndex - 1]

        if (current.target > previous.target) {
            return 'ramp-up'
        }

        if (previous.target == current.target) {
            return 'steady'
        }

        return 'ramp-down'
    }

    exec.vu.tags['stage_profile'] = getStageProfile()
}

// ============================================================================
// utils
// ============================================================================

/**
 * Produces a Universal Unique Identifier version 4
 *
 * @param {boolean} secure - whether a cryptographically secure generation function should be used
 * @returns {String} - 16 characters hexadecimal representation of the UUID v4
 */
function uuidv4(secure = false) {
    return secure ? secureUUIDv4() : insecureUUIDv4()
}

function randomIntBetween(min, max) {
    // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min)
}

function randomItem(arrayOfItems) {
    return arrayOfItems[Math.floor(Math.random() * arrayOfItems.length)]
}

function randomString(length, charset = 'abcdefghijklmnopqrstuvwxyz') {
    let res = ''
    while (length--) res += charset[(Math.random() * charset.length) | 0]
    return res
}

function findBetween(content, left, right, repeat = false) {
    const extracted = []
    let doSearch = true
    let start,
        end = 0

    while (doSearch) {
        start = content.indexOf(left)
        if (start == -1) {
            break // no more matches
        }

        start += left.length
        end = content.indexOf(right, start)
        if (end == -1) {
            break // no more matches
        }
        let extractedContent = content.substring(start, end)

        // stop here if only extracting one match (default behavior)
        if (!repeat) {
            return extractedContent
        }

        // otherwise, add it to the array
        extracted.push(extractedContent)

        // update the "cursor" position to the end of the previous match
        content = content.substring(end + right.length)
    }

    return extracted.length ? extracted : null // return all matches as an array or null
}

function normalDistributionStages(maxVus, durationSeconds, numberOfStages = 10) {
    function normalDensity(mean, scale, x) {
        return (
            Math.exp((-1 / 2) * Math.pow((x - mean) / scale, 2)) / (scale * Math.sqrt(2 * Math.PI))
        )
    }

    const mean = 0
    const scale = 1
    let curve = new Array(numberOfStages + 2).fill(0)
    let durations = new Array(numberOfStages + 2).fill(Math.ceil(durationSeconds / 6))
    let k6stages = []

    for (let i = 0; i <= numberOfStages; i++) {
        curve[i] = normalDensity(mean, scale, -2 * scale + (4 * scale * i) / numberOfStages)
    }

    let peakDistribution = Math.max(...curve)

    let vus = curve.map((x) => Math.round((x * maxVus) / peakDistribution))

    for (let j = 1; j <= numberOfStages; j++) {
        durations[j] = Math.ceil((4 * durationSeconds) / (6 * numberOfStages))
    }

    for (let k = 0; k <= numberOfStages + 1; k++) {
        k6stages.push({ duration: `${durations[k]}s`, target: vus[k] })
    }

    return k6stages
}

/**
 * Fast UUID v4 producer
 *
 * Note that this function does not produce cryptographically
 * secure UUIDs. If you need safe UUIDs, use the secureUUIDv4
 * implementation instead.
 *
 * @returns {String} - 16 characters hexadecimal representation of the UUID v4
 */
function insecureUUIDv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        let r = (Math.random() * 16) | 0,
            v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
    })
}

/**
 * Cryptographically secure UUID v4 producer
 *
 * Note that this implementation involves a computation
 * overhead.
 *
 * @returns {String} - 16 characters hexadecimal representation of the UUID v4
 */
function secureUUIDv4() {
    /**
     * bytes conversion table used to convert UUIDs bytes
     * to string form.
     */
    const byteToHex = []
    for (let i = 0; i < 256; ++i) {
        byteToHex.push((i + 0x100).toString(16).slice(1))
    }

    /**
     * produce 16 random bytes, and set UUID v4's specific
     * version and `clock_seq_hi_and_reserved` bits.
     */
    const rnds = new Uint8Array(randomBytes(16))
    rnds[6] = (rnds[6] & 0x0f) | 0x40
    rnds[8] = (rnds[8] & 0x3f) | 0x80

    /**
     * Convert array of 16 byte values to UUID string format of the form:
     * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
     */
    return (
        byteToHex[rnds[0]] +
        byteToHex[rnds[1]] +
        byteToHex[rnds[2]] +
        byteToHex[rnds[3]] +
        '-' +
        byteToHex[rnds[4]] +
        byteToHex[rnds[5]] +
        '-' +
        byteToHex[rnds[6]] +
        byteToHex[rnds[7]] +
        '-' +
        byteToHex[rnds[8]] +
        byteToHex[rnds[9]] +
        '-' +
        byteToHex[rnds[10]] +
        byteToHex[rnds[11]] +
        byteToHex[rnds[12]] +
        byteToHex[rnds[13]] +
        byteToHex[rnds[14]] +
        byteToHex[rnds[15]]
    ).toLowerCase()
}

export {
    check,
    parseDuration,
    getCurrentStageIndex,
    tagWithCurrentStageIndex,
    tagWithCurrentStageProfile,
    findBetween,
    normalDistributionStages,
    randomIntBetween,
    randomItem,
    randomString,
    uuidv4,
}
