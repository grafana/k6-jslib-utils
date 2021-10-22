export function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    let r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function randomIntBetween(min, max) { // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function randomItem(arrayOfItems){
  return arrayOfItems[Math.floor(Math.random() * arrayOfItems.length)];
}

export function randomString(length) {
  const charset = 'abcdefghijklmnopqrstuvwxyz';
  let res = '';
  while (length--) res += charset[Math.random() * charset.length | 0];
  return res;
}

export function findBetween(content, left, right) {
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

function normalDensity(mean, scale, x) {
  return Math.exp(-1/2 * Math.pow((x - mean)/scale, 2)) / (scale * Math.sqrt(2 * Math.PI))
}

export function normalDistributionStages(maxVU, duration, noStages = 1) {
  const mean = 0;
  const scale = 1;
  //changing above will change the curve
  let value = new Array(noStages+2).fill(0);
  let durations = new Array(noStages+2).fill(Math.ceil(duration/6));
  let normalStages = [];

  for(let i = 0; i <= noStages; i++) {
      value[i] = normalDensity(mean, scale, -2*scale + 4*scale*i/noStages)
  };
  let maxValue = Math.max(...value);
  let users = value.map(x => Math.round(x * maxVU / maxValue));

  for (let j = 1; j <= noStages; j++) {
      durations[j] = Math.ceil(4*duration/(6*noStages))
  };

  for (let k = 0; k <= noStages+1; k++) {
      normalStages.push({duration: `${durations[k]}s`, target: users[k]})
  };

  return normalStages
}