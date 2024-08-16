/**
 * Produces a Universal Unique Identifier version 4
 *
 * @param {boolean} secure - whether a cryptographically secure generation function should be used
 * @returns {String} - 16 characters hexadecimal representation of the UUID v4
 */
export function uuidv4(secure?: boolean): string;
export function randomIntBetween(min: any, max: any): number;
export function randomItem(arrayOfItems: any): any;
export function randomString(length: any, charset?: string): string;
export function findBetween(content: any, left: any, right: any, repeat?: boolean): any;
export function normalDistributionStages(maxVus: any, durationSeconds: any, numberOfStages?: number): {
    duration: string;
    target: number;
}[];
