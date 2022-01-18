/* eslint-disable prefer-const */

export function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    let r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function randomIntBetween(min: number, max: number): number { // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function randomItem<T>(arrayOfItems: T[]): T {
  return arrayOfItems[Math.floor(Math.random() * arrayOfItems.length)];
}

export function randomString(length: number): string {
  const charset = 'abcdefghijklmnopqrstuvwxyz';
  let res = '';
  while (length--) res += charset[Math.random() * charset.length | 0];
  return res;
}

export function findBetween(content: string, left: string, right: string): string {
  let start = content.indexOf(left);
  if (start === -1) {
    return '';
  }
  start += left.length;
  const end = content.indexOf(right, start);
  if (end === -1) {
    return '';
  }
  return content.substring(start, end);
}

export interface Stage {
  duration: string,
  target: number
}

export function normalDistributionStages(maxVus: number, durationSeconds: number, numberOfStages = 10): Stage[] {
  function normalDensity(mean: number, scale: number, x: number) {
    return Math.exp(-1 / 2 * Math.pow((x - mean) / scale, 2)) / (scale * Math.sqrt(2 * Math.PI));
  }

  const mean = 0;
  const scale = 1;
  let curve = new Array(numberOfStages + 2).fill(0);
  let durations = new Array(numberOfStages + 2).fill(Math.ceil(durationSeconds / 6));
  let k6stages = [];

  for (let i = 0; i <= numberOfStages; i++) {
    curve[i] = normalDensity(mean, scale, -2 * scale + 4 * scale * i / numberOfStages);
  }

  let peakDistribution = Math.max(...curve);

  let vus = curve.map(x => Math.round(x * maxVus / peakDistribution));

  for (let j = 1; j <= numberOfStages; j++) {
    durations[j] = Math.ceil(4 * durationSeconds / (6 * numberOfStages));
  }

  for (let k = 0; k <= numberOfStages + 1; k++) {
    k6stages.push({ duration: `${durations[k]}s`, target: vus[k] });
  }

  return k6stages;
}