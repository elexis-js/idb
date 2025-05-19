import type { $IDBObjectStore, $IDBObjectStoreOptions } from "#structure/$IDBObjectStore";
import { $IDBObjectStoreBase } from "#structure/$IDBObjectStoreBase";

export class $IDBIndex<StoreOptions extends $IDBObjectStoreOptions, Options extends $IDBIndexOptions> extends $IDBObjectStoreBase<StoreOptions, Options['keyPath']> {
    name: string;
    store: $IDBObjectStore<StoreOptions>;
    unique: boolean | undefined;
    keyPath: string | string[];
    multiEntry: boolean | undefined;
    constructor(store: $IDBObjectStore<StoreOptions>, name: string, options: Options) {
        super();
        this.name = name;
        this.store = store;
        this.unique = options.unique;
        this.keyPath = options.keyPath;
        this.multiEntry = options.multiEntry
    }

    instance(permission: IDBTransactionMode) {
        return this.store.$idb.idb.transaction(this.store.name, permission).objectStore(this.store.name).index(this.name);
    }

}

export interface $IDBIndexOptions {
    keyPath: string | string[];
    unique?: boolean;
    multiEntry?: boolean;
}