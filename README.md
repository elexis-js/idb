# @elexis.js/idb
Using IndexedDB with simplify typesafe API, auto manage store state in database version change. Based on [ElexisJS](https://github.com/defaultkavy/elexis).

## Usage
Method `$.idb()` return a IndexedDB Builder, this is the blueprint of database and object store structure. You can modify database configuration before using `open()` method.
```ts
import 'elexis';
import '@elexis.js/idb';

// open database with version 1
const $idb = await $.idb('database-name', 1).open(); 
```

## Create Store
Use `store()` method to set an object store, this is modifying the IDB builder, everything will not be change before `open()` method called.
```ts
const $idb = await $.idb('database-name', 1)
    .store('users', store => store
        // set store object key with object property
        .keyPath('id')
        // use type function generic to define object type
        .type<{
            id: number,
            name: string,
            createdTimestamp: number,
            description: string
        }>()
    )
    .store('orders', store => store
        // this object store have no keyPath and autoIncrement assigned, 
        // so it will be custom key store
        .type<{
            productName: string,
            createdTimestamp: number
        }>()
    )
    .open(); // open database
```


## Create Index
Index is the context of object store, you can create multiple index base on different object property. The creation and deletion of index must be processed during database version upgrade, we also handle this for you.
```ts

const $idb = await $.idb('database-name', 1)
    .store('orders', store => store
        .type<{
            productName: string,
            createdTimestamp: number
        }>()
        // set index of this store
        .index('by_createdTimestamp', index => index
            .keyPath('createdTimestamp')
        )
    )
```

## Key path and auto-increment
Changing key path or auto-increment option of store configuration must process in upgrade of database. We handle this process for you, any change in store configuration which don't match last version of database settings will be auto updated (and the IDB version option must larger than last version). 

Also, after using `.keyPath()` methods, the type define method `.type()` will prompt type error message if data structure not include property name that match `keyPath` option. This help developer to make sure type of data structure is satisfied object store configuration.

```ts
.store('users', store => store
    .keyPath('id')
    .type<{ // ts error: Property 'id' is missing      
        name: string
    }>()
)
```

With no key path or auto-increment option set, a custom key is required when you put object into store.

### Multi key path
You can choose two or more object property name as object key in same time.
```ts
.store('foods', store => store
    .keyPath('rates', 'createdTimestamp')
    .type({ // ts error: Property 'createdTimestamp' is missing
        rates: number,
        name: string
    })
    .index('by_multiple_key', index => index
        .keyPath('name', 'createdTimestamp') 
        // ^ ts error: Argument of type '"createdTimestamp"' 
        // is not assignable to parameter of type '"rates" | "name"'
    )
)
```

> [!TIP]
> If you don't know how key path and auto-increment options works, see this [document](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB#structuring_the_database).

## Upgrade Database
Modify IndexedDB version and store configuration can be a troublesome thing, create store, delete index, change the store key path... All these things need to processed in version upgrade event. We know this is really annoying, so we handle this for you!

When you need to modify configuration, just simply change your settings in builder methods, and change the version number.

That's it. No version upgrade event need to care, all changes will be done when the code run.

```ts
const $idb = await $.idb('database-name', 3) // <- change version number
    .store('users', store => ... ) // make some changes...
    .open(); // open database and all changes will be handled
```

### Handle object migration from last version
IndexedDB run on client's browser, this mean every client may have a different version of database, and this situation will mess everything up! Don't worry in here, all we need to do is keep the code of every version changes.

Assume there have object store need to upgraded twices, once before version `20`, once before version `42`. We can write the code like this:

```ts
const $idb = await $.idb('database-name', 42)
    .store('users', store => store
        // assume we use custom key for each object before
        // after version 42, we decide use 'id' as key path!
        .keyPath('id') 
        .type<{
            // this is data structure before version 21
            name: string,
            createdTimestamp: number,
            // this is new property after version 21
            description: string,
            // this is new property after version 42
            id: number,
            countryId: null | number
        }>()
        .upgrade(21, (list, $idb) => {
            // this upgrade function only called if database version <= 21
            return list.map(( {key, value} ) => {
                return { 
                    key: $.uuidv7().str,
                    value: { 
                        ...value,
                        description: `Hi! I'm ${value.name}!`
                    } 
                }
            })
        })
        .upgrade(42, async (list, $idb) => {
            // you can get data from other store or fetch data from external API here
            const countries = await $idb.getStore('countries').getArray();
            // this upgrade function only called if database version <= 42
            // and it will only run after upgrade function of version 21
            return list.map(( {key, value} ) => {
                const countryData = countries.find(country => country.users.include(key));
                return { 
                    key, 
                    value: {
                        ...value,
                        id: key, // assign id from object key, it should be user id
                        countryId: countryData ? countryData.id : null
                    }
                }
            })
        })
    )
    .open(); // open database and all upgrades will be handled
```

## Use Store
You can get object store by using `getStore()` method, store name must be matched the IDB builder store configuration. Otherwise, type error will show up.
```ts
$idb.getStore('dbname-not-exist');
// ^ ts error: Argument of type '"dbname-not-exist"' 
// is not assignable to parameter of type '"users" | "orders"'
```

### Put object
Use `put()` method to insert data into object store, in this example, you can see the data has missing the `createdTimestamp` property, and assign a wrong type value in `id` property. TypeScript compiler will tell you what type of value and property should be assigned.
```ts
await $idb.getStore('users').put({ // ts error: Property 'createdTimestamp' is missing
    id: '1', // ts error: Type 'string' is not assignable to type 'number'.
    name: 'Higami Tsukimi'
})
```

### Put object and update
Method `put()` without passing update option, the operation of insert object will be blocked if the object key is existed. If you want to ignore existed object and just update it with the same key, pass `true` as second method agrument.
```ts
await $idb.getStore('users').put({
    id: '1',
    name: 'Higami Tsukimi',
    createdTimestamp: Date.now()
}, true) // <- enable update option
```

### Put object with custom key
With no key path or auto-increment option set, a custom key is required when you put object into store. If you pass data directly into `put()` method, type error will be prompted.
```ts
await $idb.getStore('orders').put({
    // ts error: Argument of type '{ productName: string, createdTimestamp: number }' 
    // is not assignable to parameter of type 'OrArray<
    // [IDBValidKey, { productName: string; createdTimestamp: number; }]>'.
    productName: 'Something good',
    createdTimestamp: Date.now()
})
```
It need custom key to store data, you can use the tupple like `[CUSTOM_KEY, DATA]` to pass into `put()` method.
```ts
await $idb.getStore('orders').put(['CUSTOM_KEY', {
    productName: 'Something good',
    createdTimestamp: Date.now()
}])
```

### Put multiple object at once call
You can use the same method `put()` to insert multiple object in one transaction, just using array.
```ts
// with keyPath or auto-increment
await $idb.getStore('users').put([ user1, user2, user3, ... ])
// with custom key required
await $idb.getStore('orders').put([ [key1, user1], [key2, user2], [key3, user3], ... ])
```

### Get object by key
Using `get()` method by pass in the key of object, and the key value type check is still available in this method.
```ts
await $idb.getStore('users').get('USER_ID') 
// ^ ts error: Argument of type 'string' 
// is not assignable to parameter of type 'number'
await $idb.getStore('users').get(1)
// ^ type check pass
```

### Get object by conditional function
There have a simple way to get the object passed conditional, just pass in conditional function into `get()` method. The return value type of conditional function must be boolean, return `true` mean the data pass the conditional and data will be return as the `get()` method result.
```ts
const now = Data.now()
await $idb.getStore('users').get(data => data.createdTimestamp < now)
```

### Get object by `IDBKeyRange`
IndexedDB offer a efficient way to search key with `IDBKeyRange`, you can learn about this from [MDN Docs](https://developer.mozilla.org/en-US/docs/Web/API/IDBKeyRange). Our `get()` method is support this type of argument.
```ts
await $idb.getStore('users').get(IDBKeyRange.bound(1, 10));
```

### Get multiple objects
There have two result type of get multiple objects method, `.getArray()` and `.getMap()`, these methods both support get objects data by key, conditional function.
- `getArray()` return the array of objects. Support `IDBKeyRange` as argument.
- `getMap()` return the `Map` object, which the mapped key is the key of object data, and value is the corresponding object data.

> [!WARNING]
> If using `getMap()` in not unique key index, since JavaScript `Map` object will override object with the same key, the amount of result would be error.

```ts
// return all objects in store with no argument passed
await $idb.getStore('users').getArray();
// with keys
await $idb.getStore('users').getArray([USER_ID1, USER_ID2, USER_ID3]);
// with multiple key path
await $idb.getStore('foods').getArray([[RATES1, TIMESTAMP1], [RATES2, TIMESTAMP2]]);
// with conditional function
const date = new Date('2025-01-01');
await $idb.getStore('orders').getArray(data => data.createdTimestamp > date);
```

## Use Cursor
Cursor is a powerful database iterate tool that allows you to control your operation position between large amounts of data. We design a simple API to make you use cursor more efficiently.

### Open and control cursor
You can open cursor with using `.cursor()` method, there have three mode for giving permission to access and operation data: `readonly`, `readwrite`, `versionchange`. Without `readwrite` mode, cursor can't update or delete object.

After mode argument, a cursor operation function need to pass into `.cursor()` method. Everytime cursor point to object, this function will be called. You can use `cursor.continue()`, `cursor.advance()`, `cursor.abort()` methods to control cursor next operation.

Cursor will be closed automatic when iterate is reach the end of object, if the iterate not need to skip, `cursor.abort()` is not needed.
```ts
// Open cursor in readonly mode
await $idb.getStore('users').cursor('readonly', cursor => {
    const userData = cursor.value; // get current cursor pointing data
    if (userData.id < 10) cursor.continue(); // jump to next object and run this function again
    else if (userData.id < 20) cursor.advance(2) // jump and skip 2 object
    else cursor.abort() // close the cursor and this iterating
})
```

### Update and delete object with cursor
Use `cursor.update()` method to update object of current cursor position.
```ts
await $idb.getStore('users').cursor('readwrite', cursor => {
    const userData = cursor.value;
    if (userData.name === 'Higami Amateras') {
        cursor.update({...userData, description: 'Super CUTE girl.'});
        // ^ allowed to add custom property but it will not be assigned
        // as data type unless you update the store.type<T>()

        cursor.abort(); // close the cursor
    } else {
        cursor.delete(); // delete the data
    }
    cursor.continue(); // jump to next data and run this function again
})
```

## Use Index
You can get index with `.getIndex()` method by index name, the name argument must be matched with index configuration in `.index()` builder method.

```ts
const index = $idb.getStore('orders').getIndex('by_name');
// ^ ts error: Argument of type '"by_name"' 
// is not assignable to parameter of type '"by_createdTimestamp"'
```

Index supports the same methods from `$IDBObjectStore` like: `get()`, `getArray()`, `getMap()` and `cursor()`.