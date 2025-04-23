import type { $IDB } from "./$IDB";
import { $IDBIndex, type $IDBIndexOptions } from "./$IDBIndex";
import { $IDBObjectStoreBase, type $IDBFilter, type $IDBFilterMultiple } from "./$IDBObjectStoreBase";

export class $IDBObjectStore<Options extends $IDBObjectStoreOptions> extends $IDBObjectStoreBase<Options, Options['keyPath']> {
    name: string;
    $idb: $IDB<any>
    keyPath: string | string[];
    autoIncrement: boolean;
    indexes: { [key: string]: $IDBIndexOptions; };
    constructor($idb: $IDB<any>, name: string, options: $IDBObjectStoreOptions) {
        super();
        this.name = name;
        this.$idb = $idb;
        this.keyPath = options.keyPath;
        this.autoIncrement = options.autoIncrement;
        this.indexes = options.indexes;
    }

    async put<T extends Options['keyPath'] extends string[] 
        ? Options['type'] 
        : Options['autoIncrement'] extends true 
            ? Options['type'] 
            : [IDBValidKey, Options['type']]
        >(value: OrArray<T>, update = false): Promise<void> {
        return new Promise(async resolve => {
            const store = this.instance('readwrite');
            const array = $.orArrayResolve(value);
            array.forEach(v => {
                if (v instanceof Array) update ? store.put(v[1], v[0]) : store.add(v[1], v[0]);
                else update ? store.put(v) : store.add(v);
            })
            resolve();
        })
    }
    
    async delete(filter: $IDBFilter<Options, Options['keyPath']>): Promise<undefined> {
        return new Promise(async (resolve, reject) => {
            if (filter instanceof Function) {
                await this.cursor('readwrite', cursor => {
                    if ((filter as Function)(cursor.value)) {
                        cursor.delete();
                    }
                    cursor.continue();
                });
                resolve(undefined);
            } else {
                const req = this.instance('readwrite').delete(filter);
                //@ts-expect-error
                req.onsuccess = e => resolve(e.target.result);
                req.onerror = e => reject(e);
            }
        })
    }
    
    async deleteAll(filter?: $IDBFilterMultiple<Options, Options['keyPath']>): Promise<undefined> {
        return new Promise(async (resolve, reject) => {
            if (!arguments.length) {
                resolve(await this.deleteAll(() => true));
                return;
            }
            if (filter instanceof Function) {
                await this.cursor('readwrite', cursor => {
                    if ((filter as Function)(cursor.value)) {
                        cursor.delete();
                    }
                    cursor.continue();
                });
                resolve(undefined);
            } else if (filter) {
                const req = this.instance('readwrite').delete(filter);
                //@ts-expect-error
                req.onsuccess = e => resolve(e.target.result);
                req.onerror = e => reject(e);
            }
        })
    }

    getIndex<N extends keyof Options['indexes']>(name: N) {
        return new $IDBIndex(this, name as string, this.indexes[name as any] as any);
    }

    instance(mode: IDBTransactionMode) {
        return this.$idb.idb.transaction(this.name, mode).objectStore(this.name);
    }

}

export type $IDBObjectStoreOptions = { 
    autoIncrement: boolean;
    upgrade?: $IDBObjectUpgradeOptions[];
    indexes: {[key: string]: $IDBIndexOptions}
} & ({
    keyPath: string | string[];
    type: {}
}) & ({
    keypath: null | undefined;
    type: any
});


export interface $IDBObjectUpgradeOptions {
    beforeVersion: number;
    transformer: (list: {key: IDBValidKey, value: any}[], idb: $IDB<any>) => OrPromise< {key?: IDBValidKey, value: any}[] >;
}