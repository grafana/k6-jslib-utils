import { describe, expect } from 'https://jslib.k6.io/k6chaijs/4.3.4.0/index.js'
import exec from 'k6/execution'
import { sleep } from 'k6'

import {
    parseDuration,
    getCurrentStageIndex,
    tagWithCurrentStageIndex,
    tagWithCurrentStageProfile,
} from '../src/stages.js'

export let options = {
    scenarios: {
        parseDuration: {
            executor: 'shared-iterations',
            iterations: 1,
            exec: 'testParseDuration',
        },
        getCurrentStageIndex: {
            executor: 'ramping-vus',
            stages: [
                { duration: '1s10ms', target: 1 },
                { duration: '1s', target: 1 },
            ],
            exec: 'testGetCurrentStageIndex',
        },
        tagWithCurrentStageIndex: {
            executor: 'ramping-vus',
            stages: [
                { duration: '1s', target: 1 },
                { duration: '1s', target: 1 },
            ],
            exec: 'testTagWithCurrentStageIndex',
        },
        tagWithRampUpWhenOnlyOne: {
            executor: 'ramping-vus',
            stages: [{ duration: '0.1s', target: 1 }],
            exec: 'testTagWithRampUpProfileWhenOnlyOne',
        },
        tagWithRampUp: {
            executor: 'ramping-vus',
            stages: [
                { duration: '0.1s', target: 1 },
                { duration: '0.1s', target: 2 },
            ],
            exec: 'testTagWithRampUp',
        },
        tagWithSteady: {
            executor: 'ramping-vus',
            stages: [
                { duration: '0.1s', target: 1 },
                { duration: '0.1s', target: 1 },
            ],
            exec: 'testTagWithSteady',
        },
        tagWithRampDown: {
            executor: 'ramping-vus',
            stages: [
                { duration: '0.1s', target: 2 },
                { duration: '0.1s', target: 1 },
            ],
            exec: 'testTagWithRampDown',
        },
        'unsupported-executor': {
            executor: 'shared-iterations',
            iterations: 1,
            exec: 'testUnsupportedExecutor',
        },
    },
}

export function testGetCurrentStageIndex() {
    describe('getCurrentStageIndex', () => {
        describe('returns the first stage when is in t0', () => {
            expect(getCurrentStageIndex()).to.be.equal(0)
        })

        sleep(1.2)

        describe('returns the next stage if the iteration exceedes the expected duration', () => {
            expect(getCurrentStageIndex()).to.be.equal(1)
        })

        sleep(1)

        describe('returns the last stage when the iteration exceedes the total expected duration', () => {
            expect(getCurrentStageIndex()).to.be.equal(1)
        })
    })
}

export function testTagWithCurrentStageIndex() {
    describe('tagWithCurrentStageIndex', () => {
        describe('tags with the current stage', () => {
            tagWithCurrentStageIndex()
            expect(exec.vu.tags['stage']).to.be.equal(`${exec.scenario.iterationInTest}`)
        })

        // it forces to get only two iterations
        sleep(1)
    })
}

export function testTagWithRampUpProfileWhenOnlyOne() {
    describe('tagWithCurrentStageProfile', () => {
        describe(`tags with ramp-up profile when only one stage`, () => {
            tagWithCurrentStageProfile()
            expect(exec.vu.tags['stage_profile']).to.be.equal('ramp-up')
        })
    })
}

export function testTagWithRampUp() {
    describe('tagWithCurrentStageProfile', () => {
        describe(`tags with ramp-up profile when the current stage has a target greater than previous`, () => {
            if (exec.vu.iterationInScenario !== 1) {
                return
            }
            tagWithCurrentStageProfile()
            expect(exec.vu.tags['stage_profile']).to.be.equal('ramp-up')
        })
        sleep(0.1)
    })
}

export function testTagWithSteady() {
    describe('tagWithCurrentStageProfile', () => {
        describe(`tags with steady profile when the current stage has the same target of the previous`, () => {
            if (exec.vu.iterationInScenario !== 1) {
                return
            }
            tagWithCurrentStageProfile()
            expect(exec.vu.tags['stage_profile']).to.be.equal('steady')
        })
        sleep(0.1)
    })
}

export function testTagWithRampDown() {
    describe('tagWithCurrentStageProfile', () => {
        describe(`tags with ramp-down profile when the current stage has a target less than previous`, () => {
            if (exec.vu.iterationInScenario !== 1) {
                return
            }
            tagWithCurrentStageProfile()
            expect(exec.vu.tags['stage_profile']).to.be.equal('ramp-down')
        })
        sleep(0.1)
    })
}

export function testUnsupportedExecutor() {
    describe('throw Error if the executor is not supported', () => {
        describe('getCurrentStageIndex', () => {
            expect(getCurrentStageIndex).to.throw()
        })
        describe('tagWithCurrentStageIndex', () => {
            expect(tagWithCurrentStageIndex).to.throw()
        })
        describe('tagWithCurrentStageProfile', () => {
            expect(tagWithCurrentStageProfile).to.throw()
        })
    })
}

export function testParseDuration() {
    describe('parseDuration', () => {
        let testcase = '1d5h31m20s9ms'
        describe(testcase, () => {
            expect(parseDuration(testcase)).to.be.equal((86400 + 18000 + 1860 + 20) * 1000 + 9)
        })

        testcase = '5.2h'
        describe(testcase, () => {
            expect(parseDuration(testcase)).to.be.equal(18720 * 1000)
        })

        testcase = '1d5.2h31m20s9ms'
        describe(testcase, () => {
            expect(parseDuration(testcase)).to.be.equal((86400 + 18720 + 1860 + 20) * 1000 + 9)
        })

        // ms is the maximum precision so this case is truncated
        testcase = '9.3ms'
        describe(testcase, () => {
            expect(parseDuration(testcase)).to.be.equal(9)
        })

        testcase = '1531209'
        describe(testcase, () => {
            expect(parseDuration(testcase)).to.be.equal(1531209)
        })

        testcase = '9.h1.s'
        describe(testcase, () => {
            expect(parseDuration(testcase)).to.be.equal(32401 * 1000)
        })

        testcase = '9.h1.s'
        describe(testcase, () => {
            expect(parseDuration(testcase)).to.be.equal(32401 * 1000)
        })

        testcase = '1s12'
        describe(testcase, () => {
            expect(parseDuration(testcase)).to.be.equal(1012)
        })

        testcase = '1h-1s'
        describe(testcase, () => {
            expect(parseDuration(testcase)).to.be.equal(3601 * 1000)
        })

        testcase = '-1h 1s'
        describe(testcase, () => {
            expect(parseDuration(testcase)).to.be.equal(3601 * 1000)
        })

        testcase = '0'
        describe(testcase, () => {
            expect(parseDuration(testcase)).to.be.equal(0)
        })

        testcase = '0s'
        describe(testcase, () => {
            expect(parseDuration(testcase)).to.be.equal(0)
        })

        testcase = '1s 1s 1s'
        describe(testcase, () => {
            expect(() => {
                return parseDuration(testcase)
            }).to.throw()
        })

        testcase = '1w'
        describe(testcase, () => {
            expect(() => {
                return parseDuration(testcase)
            }).to.throw()
        })

        testcase = ''
        describe(testcase, () => {
            expect(() => {
                return parseDuration(testcase)
            }).to.throw()
        })
    })
}
