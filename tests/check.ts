import { check } from 'k6'
import { check as asyncCheck } from '../build/index.js'

export const options = {
  iterations: 1,
}

function later<T>(value: () => T, delay = 100) {
  return new Promise<T>(resolve => {
    setTimeout(() => {
      resolve(value())
    }, delay)
  })
}

export default async function () {
  const syncFnFailed = asyncCheck("", {
    "I should always fail": () => false,
  }) satisfies boolean

  const syncFnPassed = asyncCheck("", {
    "I should always pass": () => true,
  }) satisfies boolean 
 
  const asyncFnFailedPromise = asyncCheck("", {
    "I should always fail": () => later(() => false),
  }) satisfies Promise<boolean>
 
  const asyncFnPassedPromise = asyncCheck("", {
    "I should always pass": () => later(() => true),
  }) satisfies Promise<boolean> 

  const asyncFnFailed = await asyncFnFailedPromise
  const asyncFnPassed = await asyncFnPassedPromise

  const syncValueFailed = asyncCheck("", {
    "I should always fail": 0,
  }) satisfies boolean

  const syncValuePassed = asyncCheck("", {
    "I should always pass": 1,
  }) satisfies boolean

  const asyncValueFailedPromise = asyncCheck("", {
    "I should always fail": later(() => 0),
  }) satisfies Promise<boolean>

  const asyncValuePassedPromise = asyncCheck("", {
    "I should always pass": later(() => 1),
  }) satisfies Promise<boolean>
 
  const asyncValueFailed = await asyncValueFailedPromise
  const asyncValuePassed = await asyncValuePassedPromise
  
  const passesValueToChecker = asyncCheck("this is the value", {
    a: (value: string) => value === "this is the value",
  }) satisfies boolean

  const asyncValue = await asyncCheck(later(() => true), {
    "I should be true": (value: boolean) => value,
  })

  const mixAsyncValueAndAsyncChecker = await asyncCheck(later(() => "This is my value."), {
    "I should be true": (value: string) => later(() => value === "This is my value.")
  }) 

  let executedAsync = true
 
  asyncCheck("", {
    "I should always pass": later(() => {
      executedAsync = false

      return true
    }, 1000),
  })

  const failsIfAnyFail = await asyncCheck("", {
    "I should always fail": () => later(() => false),
    "I should always pass": later(() => true),
    "I should also always fail": () => null,
    "I should also always pass": 1,
  })
 
  const passIfAllPass = await asyncCheck("", {
    "I should always pass": () => later(() => true),
    "I should also always pass": later(() => true),
    "This should pass too": () => "null",
    "And this should pass": 1 
  })

  const tagged = asyncCheck("", {
    "I have tags": () => true,
  }, { hello: "world" }) satisfies boolean
  
  check(0, {
    "Function: sync check failed": () => syncFnFailed === false,
    "Function: sync check passed": () => syncFnPassed === true,
    "Function: async check failed": () => asyncFnFailed === false,
    "Function: async check succeeded": () => asyncFnPassed === true,
    "Value: sync check failed": () => syncValueFailed === false,
    "Value: sync check passed": () => syncValuePassed === true,
    "Value: async check failed": () => asyncValueFailed === false,
    "Value: async check passed": () => asyncValuePassed === true,
    "Passes value to checker": () => passesValueToChecker === true,
    "Executes check asynchronously": () => executedAsync === true,
    "Fail if any check fails": () => failsIfAnyFail === false,
    "Pass if all checks pass": () => passIfAllPass === true,
    "Could use tags": () => tagged === true,
    "Async value": () => asyncValue === true,
    "Mix async value and async checker": () => mixAsyncValueAndAsyncChecker === true
  })  
}
