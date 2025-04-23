import { $IDBCursor } from "./$IDBCursor";
import { $IDBIndex } from "./$IDBIndex";
import type { $IDBObjectStoreOptions } from "./$IDBObjectStore";


export abstract class $IDBObjectStoreBase<Options extends $IDBObjectStoreOptions, KeyPath extends string | string[]> {
    constructor() {}

    async get(resolver: $IDBFilter<Options, KeyPath>): Promise<undefined | Options['type']> {
        return new Promise(async resolve => {
            if (resolver instanceof Function) {
                await this.cursor('readonly', cursor => {
                    if (resolver(cursor.value)) { resolve(cursor.value); return}
                    else cursor.continue();
                });
                resolve(undefined);
            } else {
                const req = this.instance('readonly').get(resolver as any);
                //@ts-expect-error
                req.onsuccess = e => resolve(e.target.result);
                req.onerror = e => resolve(undefined);
            }
        })
    }

    async getArray(filter?: $IDBFilterMultiple<Options, KeyPath>, count?: number): Promise<Options["type"][]> {
        return new Promise(async resolve => {
            const IS_ARRAY = filter instanceof Array;
            const IS_FUNCTION = filter instanceof Function;
            if (IS_FUNCTION || IS_ARRAY) {
                const result = await this.query(IS_FUNCTION ? filter : undefined, IS_ARRAY ? filter : undefined, count)
                resolve(Array.from(result.values()));
            } else {
                const req = this.instance('readonly').getAll(filter, count);
                //@ts-expect-error
                req.onsuccess = e => resolve(e.target.result);
                // req.onerror = e => resolve(undefined);
            }
        })
    }

    async getMap<
        K extends Options['keyPath'] extends keyof Options['type'] ? Options['type'][Options['keyPath']] : number
    >(filter?: $IDBFilterFunction<Options> | $IDBFilterKeyPathMultiple<Options, KeyPath>, count?: number): Promise<Map<K, Options['type']>> {
        return new Promise(async resolve => {
            const IS_ARRAY = filter instanceof Array;
            const IS_FUNCTION = filter instanceof Function;
            if (IS_FUNCTION || IS_ARRAY) {
                const result = await this.query(IS_FUNCTION ? filter : undefined, IS_ARRAY ? filter : undefined, count)
                resolve(new Map(result))
            } else {
                // filter is undefined, get all
                const result = new Map<K, Options['type']>();
                await this.cursor('readonly', cursor => {
                    result.set(cursor.primaryKey as K ,cursor.value as Options['type']);
                    cursor.continue();
                });
                resolve(result)
            }
        })
    }

    async update(filter: (object: Options['type']) => boolean, update: ((object: Options['type']) => Partial<Options['type']>) | Partial<Options['type']>): Promise<undefined | Options['type']> {
        return new Promise(async resolve => {
            await this.cursor('readwrite', cursor => {
                if (filter(cursor.value)) {
                    if (update instanceof Function) { cursor.update({...cursor.value, ...update(cursor.value)}); return cursor.abort()}
                    else { cursor.update({...cursor.value, update}); return cursor.abort()}
                } else cursor.continue(); // no match
            })
            resolve(undefined);
        })
    }
    
    async cursor(mode: IDBTransactionMode, handler: (cursor: $IDBCursor<Options, KeyPath>) => void, options?: {query?: IDBValidKey | IDBKeyRange | null, direction?: IDBCursorDirection}) { 
        return new Promise<void>((resolve, reject) => {
            const req = this.instance(mode).openCursor(options?.query, options?.direction); 
            req.onsuccess = e => {
                //@ts-expect-error
                const cursor = e.target.result as IDBCursorWithValue;
                if (cursor) handler(new $IDBCursor(cursor));
                else resolve()
            };
            if (req.transaction) req.transaction.onabort = e => resolve();
            req.onerror = e => {
                //@ts-expect-error
                if (e.target?.error?.code === 20) return; // cursor transaction aborted
                reject(e);
            }
        })
    }

    abstract instance(mode: IDBTransactionMode): IDBObjectStore | IDBIndex;

    protected async query(fn: undefined | Function, arr: undefined | Array<any>, count?: number) {
        const result: [any, any][] = [];
        const IS_KEY_UNIQUE = this instanceof $IDBIndex ? this.unique : true;
        await this.cursor('readonly', cursor => {
            if (result.length === count) return cursor.abort();
            if (fn && fn(cursor.value)) result.push([cursor.key, cursor.value]);
            if (arr && arr.includes(cursor.key.toString())) {
                result.push([cursor.key, cursor.value]);
                if (IS_KEY_UNIQUE && arr.length === result.length) return cursor.abort();
            }
            cursor.continue();
        });
        return result;
    }
}

export type $IDBFilterMultiple<Options extends $IDBObjectStoreOptions, KeyPath extends string | string[]> = $IDBFilterFunction<Options> | $IDBFilterKeyPathMultiple<Options, KeyPath> | IDBKeyRange
export type $IDBFilter<Options extends $IDBObjectStoreOptions, KeyPath extends string | string[]> = $IDBFilterFunction<Options> | $IDBFilterKeyPath<Options, KeyPath> | IDBKeyRange

export type $IDBFilterFunction<Options extends $IDBObjectStoreOptions> = ((object: Options['type']) => boolean);

export type $IDBFilterKeyPathMultiple<Options extends $IDBObjectStoreOptions, KeyPath extends string | string[]> = 
KeyPath extends (string & keyof Options['type']) 
    ? TypeofObjectProperty<Options['type'], KeyPath>[]
    : TypeofObjectProperty<Options['type'], KeyPath>[number][]

export type $IDBFilterKeyPath<Options extends $IDBObjectStoreOptions, KeyPath extends string | string[]> = 
KeyPath extends (string & keyof Options['type']) 
    ? TypeofObjectProperty<Options['type'], KeyPath>
    : TypeofObjectProperty<Options['type'], KeyPath>[number]