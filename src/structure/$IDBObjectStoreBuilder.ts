import type { $IDBIndexOptions } from "./$IDBIndex";
import { $IDBIndexBuilder } from "./$IDBIndexBuilder";
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

    keyPath<K extends string[]>(...key: K) {
        this.options.keyPath = key.length === 1 ? key[0] as string : key;
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

    type<T extends Options['keyPath'] extends string[] ? {[key in Options['keyPath'][number]]: IDBValidKey} : any>() { return this as unknown as $IDBObjectStoreBuilder<Options & {type: T}>; }

    index<N extends string, T extends (index: $IDBIndexBuilder<Options, $IDBIndexOptions>) => $IDBIndexBuilder<Options, $IDBIndexOptions>>(name: N, index: T) {
        this.options.indexes[name] = index(new $IDBIndexBuilder(name)).options;
        return this as unknown as $IDBObjectStoreBuilder<Options & {indexes: Record<N, ReturnType<T>['options']>}>;
    }
}