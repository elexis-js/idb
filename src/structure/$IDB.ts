import type { $IDBIndexOptions } from "./$IDBIndex";
import { $IDBObjectStore, type $IDBObjectStoreOptions } from "./$IDBObjectStore";

export class $IDB<Options extends $IDBOpenOptions> {
    idb: IDBDatabase;
    options: Options;
    constructor(idb: IDBDatabase, options: Options) {
        this.idb = idb;
        this.options = options;
    }

    static async open<O extends $IDBOpenOptions>(dbName: string, options: O): Promise<$IDB<O>> {
        return new Promise<$IDB<typeof options>>(resolve => {
            const upgradeStoreMap = new Map<string, $IDBObjectStoreOptions>(); 
            const createStoreMap = new Map<string, $IDBObjectStoreOptions>();
            const createIndexMap = new Map<string, [string, $IDBIndexOptions][]>();
            const deleteStoreNames: string[] = [];
            const objectCache = new Map<string, [any, any][]>();
            const init_open = indexedDB.open(dbName);
            // first create db
            init_open.onupgradeneeded = e => {
                const storeOptionsMap = new Map(Object.entries(options.stores));
                for (const [s_name, s_options] of storeOptionsMap) {
                    createStoreMap.set(s_name, s_options)
                    const indexList: [string, $IDBIndexOptions][] = [];
                    createIndexMap.set(s_name, indexList)
                    for (const [i_name, i_options] of Object.entries(s_options.indexes)) indexList.push([i_name, i_options]) 
                }
                //@ts-expect-error
                const idb = e.target.result as IDBDatabase;
                //@ts-expect-error
                const transaction = e.target.transaction as IDBTransaction;
                if (idb.version === options.version) upgradeStore(e)
                else transaction.oncomplete = e => {
                    const upgrade_open = indexedDB.open(dbName, options.version);
                    upgrade_open.onupgradeneeded = upgradeStore
                }
            }
            // db existed, check version and process different config
            init_open.onsuccess = async e => {
                //@ts-expect-error
                const idb = e.target.result as IDBDatabase;
                if (options.version === idb.version) return resolve(new $IDB(idb, options));
                const storeOptionsMap = new Map(Object.entries(options.stores));
                const transaction = idb.objectStoreNames.length ? idb.transaction(Array.from(idb.objectStoreNames), 'readonly') : null;
                if (transaction) {
                    Array.from(transaction.objectStoreNames).filter(name => !storeOptionsMap.has(name))
                        .forEach(name => deleteStoreNames.push(name))
                }
                // CHECK STORE CONFIG MATCH
                for (const [s_name, s_options] of storeOptionsMap) {
                    const [store] = $.trycatch(() => transaction ? transaction.objectStore(s_name) : null);
                    if (!store) { createStoreMap.set(s_name, s_options); checkIndex(true); continue }
                    const NO_CHANGE = s_options === undefined && (store.keyPath === undefined && store.autoIncrement === undefined);
                    const OBJECT_UPGRADE = !s_options?.upgrade?.filter(config => options.version >= config.beforeVersion && idb.version < config.beforeVersion).length;
                    const CONFIG_MATCHED = store.keyPath.toString() === s_options?.keyPath.toString() as any && store.autoIncrement === !!s_options?.autoIncrement;
                    const UPGRADE_NEEDED = !NO_CHANGE && OBJECT_UPGRADE && !CONFIG_MATCHED;
                    if (UPGRADE_NEEDED) upgradeStoreMap.set(s_name, s_options);
                    checkIndex();
                    function checkIndex(force = false) {
                        for (const [i_name, i_options] of Object.entries(s_options.indexes)) {
                            if (force || !store) { addCreateIndex(); continue; }
                            const NAME_EXIST = store.indexNames.contains(i_name);
                            if (NAME_EXIST) {
                                const index = store.index(i_name);
                                const CONFIG_MATCHED = index.multiEntry === !!i_options.multiEntry && index.keyPath.toString() === i_options.keyPath.toString() && index.unique === !!i_options.unique
                                if (CONFIG_MATCHED) continue;
                                addCreateIndex();
                            } else addCreateIndex();

                            function addCreateIndex() {
                                const indexList = createIndexMap.get(s_name) ?? [];
                                indexList.push([i_name, i_options]);
                                createIndexMap.set(s_name, indexList);
                            }
                        }
                    }
                }
                const $idb = new $IDB(idb, options);
                // resolve if no store need upgrade
                if (idb.version === options.version && !upgradeStoreMap.size && !createStoreMap.size && !deleteStoreNames.length && !createIndexMap.size) return resolve($idb as $IDB<O>);
                // cache objects of reset store
                for (const [s_name, s_options] of upgradeStoreMap) {
                    const store = $idb.getStore(s_name);
                    const cache: [any, any][] = [];
                    objectCache.set(s_name, cache);
                    const transformerList = s_options?.upgrade?.filter(config => options.version >= config.beforeVersion && idb.version < config.beforeVersion).sort((a, b) => a.beforeVersion - b.beforeVersion).map(config => config.transformer);
                    await store.cursor('readonly', async cursor => {
                        cache.push([cursor.key, cursor.value])
                        cursor.continue();
                    })
                    await transform(); 
                    async function transform() {
                        if (transformerList) for (const transformer of transformerList) {
                            const transformed = await transformer(cache.map(([key, value]) => ({key, value})), $idb)
                            const upgradedCache = transformed.map(({key, value}) => [key, value] as [any, any])
                            objectCache.set(s_name, upgradedCache);
                        }
                    }
                }
                // upgrade
                idb.close();
                const upgrade_open = indexedDB.open(dbName, options.version);
                upgrade_open.onupgradeneeded = upgradeStore
            }

            function upgradeStore(e: Event) {
                //@ts-expect-error
                const idb = e.target.result as IDBDatabase;
                const $idb = new $IDB(idb, options);
                //@ts-expect-error
                const transaction = e.target.transaction as IDBTransaction;
                // create stores
                for (const [s_name, s_options] of createStoreMap) {
                    idb.createObjectStore(s_name, s_options);
                }
                // reset stores
                for (const [s_name, s_options] of upgradeStoreMap) {
                    // delete and re-create
                    idb.deleteObjectStore(s_name);
                    idb.createObjectStore(s_name, s_options);
                }
                // create index
                for (const [s_name, index] of createIndexMap) {
                    const store = transaction.objectStore(s_name);
                    for (const [i_name, i_options] of index) {
                        if (store.indexNames.contains(i_name)) store.deleteIndex(i_name);
                        store.createIndex(i_name, i_options.keyPath, i_options);
                    }
                }
                // delete unused stores
                if (options.deleteUnusedStore) deleteStoreNames.forEach(name => idb.deleteObjectStore(name));
                indexedDB.open(dbName).onsuccess = e => {
                    for (const [s_name, objList] of objectCache) {
                        const transaction = idb.transaction(s_name, 'readwrite');
                        const store = transaction.objectStore(s_name);
                        objList.forEach(([key, obj]) => {
                            if (store.autoIncrement || store.keyPath) store.add(obj);
                            else store.add(obj, key)
                        });
                        transaction.commit();
                    }
                    resolve($idb as $IDB<O>);
                }
            }
        })
    }

    getStore<N extends keyof Options['stores'], O extends Options['stores'][N]>(name: N): $IDBObjectStore<O> { return new $IDBObjectStore(this, name as string, this.options.stores[name] as any) }
}

export interface $IDBOpenOptions {
    version: number;
    stores: {
        [key: string]: $IDBObjectStoreOptions
    };
    deleteUnusedStore?: boolean;
}