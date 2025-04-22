import { $IDBCursor } from "./$IDBCursor";
import type { $IDBObjectStoreOptions } from "./$IDBObjectStore";


export abstract class $IDBObjectStoreBase<Options extends $IDBObjectStoreOptions> {
    constructor() {
    }

    async get(filter: (object: Options['type']) => boolean): Promise<undefined | Options['type']> {
        return new Promise(async resolve => {
            await this.cursor('readonly', cursor => {
                if (filter(cursor.value)) { resolve(cursor.value); return cursor.deleteCursor(); }
                else cursor.continue();
            });
            resolve(undefined);
        })
    }

    async getAll<K extends Options['keyPath'] extends keyof Options['type'] ? Options['type'][Options['keyPath']] : number>(filter: (object: Options['type']) => boolean): Promise<Map<K, Options['type']>> {
        return new Promise(async resolve => {
            const result = new Map<K, Options['type']>();
            await this.cursor('readonly', cursor => {
                if (filter(cursor.value)) result.set(cursor.primaryKey as K ,cursor.value as Options['type']);
                cursor.continue();
            });
            resolve(result)
        })
    }

    async update(filter: (object: Options['type']) => boolean, update: ((object: Options['type']) => Partial<Options['type']>) | Partial<Options['type']>): Promise<undefined | Options['type']> {
        return new Promise(async resolve => {
            await this.cursor('readwrite', cursor => {
                if (filter(cursor.value)) {
                    if (update instanceof Function) { cursor.updateValue({...cursor.value, ...update(cursor.value)}); return cursor.deleteCursor(); }
                    else { cursor.updateValue({...cursor.value, update}); return cursor.deleteCursor(); }
                } else cursor.continue(); // no match
            })
            resolve(undefined);
        })
    }
    
    async cursor(mode: IDBTransactionMode, handler: (cursor: $IDBCursor) => void) { 
        return new Promise<void>((resolve, reject) => {
            const req = this.instance(mode).openCursor(); 
            req.onsuccess = e => {
                //@ts-expect-error
                const cursor = e.target.result as IDBCursorWithValue;
                if (cursor) handler(new $IDBCursor(cursor));
                else resolve()
            };
            req.onerror = e => reject('IDBCursor Error')
        })
    }

    abstract instance(mode: IDBTransactionMode): IDBObjectStore | IDBIndex;
}