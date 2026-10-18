import { check, sleep } from 'k6'
import exec from 'k6/execution'

import { tagWithCurrentStageProfile } from '../src/index.js'

const cases = {
    vusUp: { executor: 'ramping-vus', startVUs: 1, target: 2, expected: 'ramp-up' },
    vusZeroStart: { executor: 'ramping-vus', startVUs: 0, target: 2, expected: 'ramp-up' },
    vusDown: { executor: 'ramping-vus', startVUs: 2, target: 1, expected: 'ramp-down' },
    vusSteady: { executor: 'ramping-vus', startVUs: 1, target: 1, expected: 'steady' },
    vusDefaultStart: { executor: 'ramping-vus', target: 1, expected: 'steady' },
    rateUp: { executor: 'ramping-arrival-rate', startRate: 30, target: 60, expected: 'ramp-up' },
    rateZeroStart: {
        executor: 'ramping-arrival-rate',
        startRate: 0,
        target: 60,
        expected: 'ramp-up',
    },
    rateDown: {
        executor: 'ramping-arrival-rate',
        startRate: 60,
        target: 30,
        expected: 'ramp-down',
    },
    rateSteady: { executor: 'ramping-arrival-rate', startRate: 30, target: 30, expected: 'steady' },
    rateDefaultStart: { executor: 'ramping-arrival-rate', target: 60, expected: 'ramp-up' },
}

export const options = {
    scenarios: {},
    thresholds: {},
}

for (const [name, testCase] of Object.entries(cases)) {
    const scenario = {
        executor: testCase.executor,
        stages: [{ duration: '1s', target: testCase.target }],
        gracefulStop: '100ms',
    }
    if (testCase.executor === 'ramping-vus') {
        scenario.gracefulRampDown = '0s'
        if (testCase.startVUs !== undefined) scenario.startVUs = testCase.startVUs
    } else {
        scenario.preAllocatedVUs = 1
        if (testCase.startRate !== undefined) scenario.startRate = testCase.startRate
    }
    options.scenarios[name] = scenario
    options.thresholds[`checks{scenario:${name}}`] = ['rate==1']
}

export default function () {
    const testCase = cases[exec.scenario.name]
    if (exec.vu.iterationInScenario === 0) {
        tagWithCurrentStageProfile()
        check(exec.vu.tags.stage_profile, {
            [`first stage is ${testCase.expected}`]: (profile) => profile === testCase.expected,
        })
    }
    if (testCase.executor === 'ramping-vus') sleep(1)
}
