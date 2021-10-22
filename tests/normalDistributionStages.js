import { sleep } from 'k6';
import exec from 'k6/execution';
import { normalDistributionStages } from '../src/utils.js'

export const options = {
  stages: normalDistributionStages(10, 20, 5)
}

export default function () {
  console.log(exec.instance.vusActive)
  sleep(1)
}

/*
Read more about normal distribution here: https://en.wikipedia.org/wiki/Normal_distribution
normalDistributionStages(maxVU, duration, noStages):
maxVU: maximum number of users used when you reach peak
duration: duration of the whole test in seconds; whole test might take a couple of seconds longer due to rounding
  ramp-up (1/6 of duration)
  test (4/6 of duration)
  ramp-down (1/6 of duration)
noStages: number of stages you want to have in test (excluding ramp-up and ramp-down); I recommend even number to have only 1 peak
*/