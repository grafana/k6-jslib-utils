import exec from 'k6/execution'

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

export { parseDuration, getCurrentStageIndex, tagWithCurrentStageIndex, tagWithCurrentStageProfile }
