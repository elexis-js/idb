import type { $IDBIndexOptions } from "./$IDBIndex";
import type { $IDBObjectStoreOptions, $IDBObjectUpgradeOptions } from "./$IDBObjectStore";

export class $IDBObjectStoreBuilder<Options extends $IDBObjectStoreOptions> {
    name: string;
    options: Options;
    constructor(name: string) {
        this.name = name;
        this.options = {
            keyPath: null,
            autoIncrement: false,
            upgrade: [],
            indexes: {}
        } as unknown as Options
    }

    keyPath<K extends null | string | string[]>(key: K) {
        this.options.keyPath = key as any;
        return this as unknown as $IDBObjectStoreBuilder<Options & {keyPath: K}>
    }

    autoIncrement<B extends boolean>(enable: B) {
        this.options.autoIncrement = enable;
        return this as unknown as $IDBObjectStoreBuilder<Options & {autoIncrement: B}>
    }

    upgrade(beforeVersion: number, transformer: $IDBObjectUpgradeOptions['transformer']) {
        this.options.upgrade?.push({beforeVersion, transformer});
        return this;
    }

    type<T extends Options['keyPath'] extends string ? {[key in Options['keyPath']]: IDBValidKey} : any>() { return this as unknown as $IDBObjectStoreBuilder<Options & {type: T}>; }

    index<N extends string, K extends string | string[]>(name: N, keyPath: K, options?: Partial<Omit<$IDBIndexOptions, 'keyPath'>>) {
        this.options.indexes[name] = { keyPath, multiEntry: false, unique: false, ...options };
        return this as unknown as $IDBObjectStoreBuilder<Options & {indexes: { [key in N]: { keyPath: K } & typeof options }}>;
    }
}
