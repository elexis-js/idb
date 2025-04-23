import type { $IDBIndexOptions } from "./$IDBIndex";
import type { $IDBObjectStoreOptions } from "./$IDBObjectStore";

export class $IDBIndexBuilder<StoreOptions extends $IDBObjectStoreOptions, Options extends $IDBIndexOptions> {
    name: string;
    options: Options;
    constructor(name: string) {
        this.name = name;
        this.options = {
            keyPath: null,
            multiEntry: false,
            unique: false
        } as any
    }

    keyPath<K extends (string & keyof StoreOptions['type'])[]>(...key: K): $IDBIndexBuilder<StoreOptions, Options & {keyPath: K}> {
        this.options.keyPath = key.length === 1 ? key[0] as string : key;
        return this as any;
    }

    multiEntry<B extends boolean>(enable: B): $IDBIndexBuilder<StoreOptions, Options & {multiEntry: B}> {
        this.options.multiEntry = enable;
        return this as any;
    }

    unique<B extends boolean>(enable: B): $IDBIndexBuilder<StoreOptions, Options & {unique: B}> {
        this.options.unique = enable;
        return this as any;
    }
}