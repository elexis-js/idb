import type { $IDB } from "./$IDB";
import { $IDBIndex, type $IDBIndexOptions } from "./$IDBIndex";
import { $IDBObjectStoreBase } from "./$IDBObjectStoreBase";

export class $IDBObjectStore<Options extends $IDBObjectStoreOptions> extends $IDBObjectStoreBase<Options> {
    name: string;
    $idb: $IDB<any>
    constructor($idb: $IDB<any>, name: string) {
        super();
        this.name = name;
        this.$idb = $idb;
    }

    async put(value: OrArray<Options['keyPath'] extends string ? Options['type'] : Options['autoIncrement'] extends true ? Options['type'] : [IDBValidKey, Options['type']]>): Promise<void> {
        return new Promise(async resolve => {
            const store = this.instance('readwrite');
            const array = $.orArrayResolve(value);
            array.forEach(v => {
                if (v instanceof Array) store.add(v[1], v[0]);
                else store.add(v)
            })
            resolve();
        })
    }

    // async index(index: number) {
    //     return new Promise<Options['type'] | undefined>(async resolve => {
    //         let i = 0;
    //         await this.cursor(cursor => {
    //             if (index === i) return resolve(cursor.value);
    //             i++;
    //             cursor.advance(index);
    //         })
    //         resolve(undefined)
    //     })
    // }

    getIndex<N extends keyof Options['indexes']>(name: N) {
        return new $IDBIndex(this, name as string);
    }

    instance(mode: IDBTransactionMode) {
        return this.$idb.idb.transaction(this.name, mode).objectStore(this.name);
    }

}

export type $IDBObjectStoreOptions = { 
    autoIncrement?: boolean;
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