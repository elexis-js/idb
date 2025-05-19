import { type $IDBOpenOptions, $IDB } from "#structure/$IDB";
import type { $IDBObjectStoreOptions } from "#structure/$IDBObjectStore";
import { $IDBObjectStoreBuilder } from "#structure/$IDBObjectStoreBuilder";

export class $IDBBuilder<Options extends $IDBOpenOptions> {
    name: string;
    options: Options;
    constructor(name: string, version: number) {
        this.name = name;
        this.options = {
            version: version,
            stores: {},
            deleteUnusedStore: false
        } as unknown as Options;
    }

    store<N extends string, R extends $IDBObjectStoreBuilder<Options['stores'][N]>>(name: N, callback: (store: $IDBObjectStoreBuilder<Options['stores'][N]>) => R) {
        const store = callback(new $IDBObjectStoreBuilder(name));
        this.options.stores[store.name] = store.options;
        return this as unknown as $IDBBuilder<Options & {stores: Record<N, $IDBObjectOptionsResolver<ReturnType<typeof callback>['options']>>}>;
    }

    deleteUnusedStore(enable: boolean) {
        this.options.deleteUnusedStore = enable;
        return this;
    }

    async open(): Promise<$IDB<Options>> {
        return await $IDB.open(this.name, this.options)
    }
}

type $IDBObjectOptionsResolver<O extends $IDBObjectStoreOptions> = O['type'] extends number ? O & {type: 1} : O;