import { randomBytes } from "k6/crypto";

/**
 * Produces a Universal Unique Identifier version 4
 *
 * @param {boolean} secure - whether a cryptographically secure generation function should be used
 * @returns {String} - 16 characters hexadecimal representation of the UUID v4
 */
export function uuidv4(secure = false) {
  return secure ? secureUUIDv4() : insecureUUIDv4();
}

export function randomIntBetween(min, max) { // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function randomItem(arrayOfItems){
  return arrayOfItems[Math.floor(Math.random() * arrayOfItems.length)];
}

export function randomString(length, charset='abcdefghijklmnopqrstuvwxyz') {
  let res = '';
  while (length--) res += charset[(Math.random() * charset.length) | 0];
  return res;
}

export function findBetween(content, left, right, repeat = false) {
  const extracted = [];
  let doSearch = true;
  let start, end = 0;
  
  while (doSearch) {
    start = content.indexOf(left);
    if (start == -1) {
      break; // no more matches
    }

    start += left.length;
    end = content.indexOf(right, start);
    if (end == -1) {
      break; // no more matches
    }
    let extractedContent = content.substring(start, end);

    // stop here if only extracting one match (default behavior)
    if (!repeat) {
      return extractedContent; 
    }

    // otherwise, add it to the array
    extracted.push(extractedContent);
    
    // update the "cursor" position to the end of the previous match
    content = content.substring(end + right.length);
  }

  return extracted.length ? extracted : null; // return all matches as an array or null
}

export function normalDistributionStages(maxVus, durationSeconds, numberOfStages=10) {
  function normalDensity(mean, scale, x) {
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
    k6stages.push({duration: `${durations[k]}s`, target: vus[k]});
  }

  return k6stages;
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
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    let r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
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
  const byteToHex = [];
  for (let i = 0; i < 256; ++i) {
    byteToHex.push((i + 0x100).toString(16).slice(1));
  }

  /**
   * produce 16 random bytes, and set UUID v4's specific
   * version and `clock_seq_hi_and_reserved` bits.
   */
  const rnds = new Uint8Array(randomBytes(16));
  rnds[6] = (rnds[6] & 0x0f) | 0x40;
  rnds[8] = (rnds[8] & 0x3f) | 0x80;

  /**
   * Convert array of 16 byte values to UUID string format of the form:
   * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
   */
  return (
    byteToHex[rnds[0]] +
    byteToHex[rnds[1]] +
    byteToHex[rnds[2]] +
    byteToHex[rnds[3]] +
    "-" +
    byteToHex[rnds[4]] +
    byteToHex[rnds[5]] +
    "-" +
    byteToHex[rnds[6]] +
    byteToHex[rnds[7]] +
    "-" +
    byteToHex[rnds[8]] +
    byteToHex[rnds[9]] +
    "-" +
    byteToHex[rnds[10]] +
    byteToHex[rnds[11]] +
    byteToHex[rnds[12]] +
    byteToHex[rnds[13]] +
    byteToHex[rnds[14]] +
    byteToHex[rnds[15]]
  ).toLowerCase();
}
