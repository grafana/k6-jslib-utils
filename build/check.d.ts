type CheckValue = Array<unknown> | Record<string | number | symbol, unknown> | boolean | string | number | null | undefined;
type Checker<T> = ((value: T) => CheckValue) | ((value: T) => Promise<CheckValue>) | CheckValue | Promise<CheckValue>;
interface CheckMap<T> {
    [key: string]: Checker<T>;
}
interface SyncCheckMap {
    [key: string]: ((value: any) => CheckValue) | CheckValue;
}
type CheckResult<C extends CheckMap<any>> = C extends SyncCheckMap ? boolean : Promise<boolean>;
export declare function check<T, C extends CheckMap<T>>(value: T, checkers: C, tags?: Record<string, string>): CheckResult<C>;
export {};
