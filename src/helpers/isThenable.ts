import { isFunction } from './isFunction';

export function isThenable(v): v is Promise<unknown> {
    return v && isFunction(v.then);
}