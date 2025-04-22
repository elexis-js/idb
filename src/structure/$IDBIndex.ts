import type { $IDBObjectStore, $IDBObjectStoreOptions } from "./$IDBObjectStore";
import { $IDBObjectStoreBase } from "./$IDBObjectStoreBase";

export class $IDBIndex<StoreOptions extends $IDBObjectStoreOptions, Options extends $IDBIndexOptions> extends $IDBObjectStoreBase<StoreOptions> {
    name: string;
    store: $IDBObjectStore<StoreOptions>;
    constructor(store: $IDBObjectStore<StoreOptions>, name: string) {
        super();
        this.name = name;
        this.store = store;
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