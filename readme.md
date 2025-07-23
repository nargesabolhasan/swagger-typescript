[![NPM](https://nodei.co/npm/swagger-typescript.png)](https://nodei.co/npm/swagger-typescript/)

[![install size](https://packagephobia.now.sh/badge?p=swagger-typescript)](https://packagephobia.now.sh/result?p=swagger-typescript) [![dependencies](https://david-dm.org/hosseinmd/swagger-typescript.svg)](https://david-dm.org/hosseinmd/swagger-typescript.svg)

:star::star::star: If you would like to contribute, please refer to [To do list](https://github.com/hosseinmd/swagger-typescript/projects/1) and a list of [open tasks](https://github.com/hosseinmd/swagger-typescript/issues?q=is%3Aopen).:star::star::star:

# Swagger-Typescript: Generate ts/js code from swagger/openApi JSON

Support OpenApi v3, swagger v2 and postman collection

An auto typescript/javascript/kotlin code generator from APIs doc.
Each endpoint will be created as a function, full type base.
Supported

- Generating a function for every apis
- Generating all types, interfaces and enums which used in apis
- React hooks.
- SignalR hub.
- Generating mock data.

For Example:
Get method of '/Account' path will be this code in services.ts

```js
import { getAccount } from "./services";

const response = await getAccount({ id: 1234 });
```

## install

`$ yarn add swagger-typescript prettier -D && yarn add axios`

## get start

Before running, add your config to swagger.config.json

#### swagger.config.json

```json
{
  "url": "http://example.com/api/swagger.json",
  "dir": "./services",
  "prefix": "/api"
}
```

#### run

```
yarn swag-ts
```

#### config.ts

[more](#config)

baseConfig

```ts
const baseConfig: AxiosRequestConfig = {
  baseURL: "", // <--- Add your base url
  //other static configs
};
```

Now you can use APIs, So for advanced config read below.

## swagger.config.json

For Example:

```json
{
  "$schema": "https://raw.githubusercontent.com/hosseinmd/swagger-typescript/master/schema/v6.json",
  "url": "http://example.com/api/swagger.json",
  "dir": "./services",
  "prettierPath": ".prettierrc",
  "language": "typescript"
}
```

| [`Key`]              | [`default`]            | Comment                                                                                                                                                                                                                                        |
| -------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `url`                | Required               | swagger or postman collection Address. can be online or local (json/yaml) ([specific branch](#specific-branch))                                                                                                                                |
| `dir`                | Required               | Address of output                                                                                                                                                                                                                              |
| `language`           | `typescript`           | export to "javascript", "typescript" or "kotlin"                                                                                                                                                                                               |
| `methodName`         | `{method}{path}`       | Supported mixed of "{method}{path}{operationId}". for Example: 'service{method}{path}'                                                                                                                                                         |
| `prefix`             | Optional               | prefix value will be removed from method name For example your endpoints is like "/api/v2/users", If you don't want add "/api/v2" to method name, add it to prefix                                                                             |
| `ignore`             | Optional               | Ignore headers from type for Example: `"ignore": { "headerParams": ["terminalId"]}`                                                                                                                                                            |
| `mock`               | false                  | For generate response mocks                                                                                                                                                                                                                    |
| `keepJson`           | false                  | This code will keep previous JSON for updating partially. change it to true then generate service for creating your first json file then you can update a tag for example `$ yarn swag-ts User` will update your user APIs which have User tag |
| `reactHooks`         | false                  | For generate react hooks of all APIs (using react-query under the hood)                                                                                                                                                                        |
| `useQuery`           | []                     | List of apis which is get but developed with post methods (Is useful for rest apis) for Example: ["postTicketsGetall"] (Needed to enable `reactHooks`)                                                                                         |
| `useInfiniteQuery`   | []                     | List of apis which is get and could be handle infinity (Needed to enable `reactHooks`) parameter should be one of `page`, `pageNo` or `pageNumber`                                                                                             |
| `local`              | false                  | update swagger with local swagger.json located in your dir folder. add it to your config file or run it with cli `$ yarn swag-ts --local`                                                                                                      |
| `kotlinPackage`      | Required (Only kotlin) | package name of source dir                                                                                                                                                                                                                     |
| `generateEnumAsType` | false                  |
| `includes`           | []                     | A list of regex patterns that specify which APIs to include based on matching method names                                                                                                                                                     |
| `excludes`           | []                     | A list of regex patterns that specify which APIs to exclude based on matching method names                                                                                                                                                     |

- `enum ReferralStatus {Successed="Successed","Error"="Error"} `
- `type ReferralStatus="Successed" | "Error"; // generateEnumAsType = true `

# CLI Options

| [`Key`]  | [`default`]             | Comment                                                                                                                                                                                                                                                                                                                                        |
| -------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `local`  | false                   | update swagger with local swagger.json located in your dir folder. add it to your config file or run it with cli `$ yarn swag-ts --local`                                                                                                                                                                                                      |
| `branch` | Current Branch          | to generate swagger for develop run `yarn swag-ts --branch=develop` or your branch name should be `develop` or a branch which created from develop                                                                                                                                                                                             |
| `config` | "./swagger.config.json" | A path for config file location <br> - `yarn swag-ts --config=./config` path is related for "swagger.config.json" file in config folder <br> - `yarn swag-ts --config=./config/myswagger.json` you could change config file name <br> - `yarn swag-ts --config=/user/hosseinmd/desktop/config/swagger.config.json` you could add absolute path |
|          |

## Config

The config.ts file automatically will be created after first run. You could change this file for customization. Don't change other files, if you want another config create Issue or PR.

- getAxiosInstance

  getAxiosInstance used for create an instance of axios request you can customize that for what you needed

- baseConfig

  baseConfig used for get static configs and headers. if you need some dynamic configs like add authentication to headers use `requestConfig.headers.authorization` into of `axiosInstance.interceptors.request.use` function.

## Run by node

```js
const { generate } = require("swagger-typescript");

generate(config);
// or
generate(); // will be use ./swagger.config.json
```

## Conflict

In some situation teams have parallel backend development which cause conflict when updating swagger for solving this we have partially update, you can update your service just for a few tags and keep other old services codes.

For Doing this you need to add this to your swagger.config.json

```
"keepJson": true,
```

This code will keep previous JSON for updating partially.

Run `$ yarn swag-ts` with your base backend, for example develop branch

Others need to pull this changes

Now you can update Tag1 and Tag2 `$ yarn swag-ts Tag1 Tag2`.

## Multiple Gateway

if you have multiple gateway in your project you could handle it by add array of config in swagger.config.json

```json
[
  {
    "$schema": "https://raw.githubusercontent.com/hosseinmd/swagger-typescript/master/schema/v6.json",
    "url": "http://example1.com/api/swagger.json",
    "dir": "./service1",
    "prettierPath": ".prettierrc",
    "language": "typescript"
  },
  {
    "$schema": "https://raw.githubusercontent.com/hosseinmd/swagger-typescript/master/schema/v6.json",
    "url": "http://example2.com/api/swagger.json",
    "dir": "./service2",
    "prettierPath": ".prettierrc",
    "language": "typescript"
  }
]
```

## Specific branch

if you are managing project by multiple branch like gitflow, you need to update swagger based on you working branch or parent branch (for example your parent is develop if you create a branch from develop).

For Example:

```json
{
  "url": [
    {
      "branch": "master",
      "url": "http:/example.com/api/swagger.json"
    },
    {
      "branch": "develop",
      "url": "http://stage.example.com/api/swagger.json"
    }
  ]
}
```

to generate swagger for develop run `yarn swag-ts --branch=develop` or your branch name should be `develop` or a branch which created from develop

# ✨ New Feature: Conditional `useQuery` / `useInfiniteQuery` Hooks

> **Available from v7.0.0** – upgrade with `yarn upgrade swagger-typescript@latest`

React ‑query hooks generated by **swagger ‑typescript** can now switch between **`useQuery`** and **`useInfiniteQuery`** **at run ‑time**.

* **No breaking changes** – existing code that calls hooks without extra options still behaves exactly the same (`useQuery`).
* **Opt‑in per call‐site** – pass `{ infinit: true }` as the second argument and the hook transparently becomes an *infinite* query.
* **Optional fallback** – keep both standard and infinite versions by setting `keepUseQuery` (see below).

---

## Updated `swagger.config.json`

```jsonc
{
  // …all your previous options

  "reactHooks": true,

  "useInfiniteQuery": [
    "getProducts",
    "getPriceList",       // ← it must be infinite (old usage)
    {
      "keys": [           // ← list of method names that *can* be infinite
        "getPosts",
       "getComments"
      ],
     "keepUseQuery": true // ← keep the classic useQuery overload as well
    }
   ]
}
```

| Key            | Type / Default        | Description                                                                                                         |
| -------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `keys`         | `string[]` (required) | Method names (generated **function** names, case‑insensitive) eligible for *infinite* behaviour.                    |
| `keepUseQuery` | `boolean` (`false`)   | When `true`, two overloads are emitted: **run‑time** switch (preferred) *and* the legacy `useQuery`‑only signature. |

> **Legacy Array Style** – Passing a simple string array (`["getUsers", "getProducts"]`) is still supported for backward compatibility. This behaves as if `keepUseQuery` was `false`.

---

## Generated Hook Signatures

```ts
// before v7
function useGetPosts(params?: GetPostsParams, opts?: UseQueryOptions) : UseQueryResult<GetPostsResponse>;

// v7+ with `useInfiniteQuery` feature
function useGetPosts(
  params?: GetPostsParams,
  opts?: UseQueryOptions & { infinit?: false }
): UseQueryResult<GetPostsResponse>;

function useGetPosts(
  params?: GetPostsParams,
  opts?: UseInfiniteQueryOptions & { infinit: true }
): UseInfiniteQueryResult<GetPostsResponse[]>;
```

Internally we just forward to the appropriate React ‑Query hook:

```ts
return opts?.infinit
  ? useInfiniteQuery(queryKey, fetcher, opts)
  : useQuery(queryKey, fetcher, opts);
```

---

## Usage Examples

### Standard query (unchanged)

```tsx
const { data, isLoading } = useGetPosts();
```

### Infinite query (new!)

```tsx
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useGetPosts({}, { infinit: true, getNextPageParam: (last) => last.nextCursor });
```

### Keep both overloads (when `keepUseQuery: true`)

```tsx
// Explicit standard query even though the endpoint is in the keys list
await useGetPosts({}, { infinit: false });
```

---

## Your Custom Hook Feature

With the new behavior, a hook like `useGetGenereted()` supports both classic and infinite queries based on the `infinit` flag:

```tsx
// useQuery mode
const result = useGetGenereted();

// useInfiniteQuery mode
const infiniteResult = useGetGenereted({}, { infinit: true });
```

Make sure `getGenereted` is included in the `useInfiniteQuery.keys` array in your `swagger.config.json`:

```jsonc
"useInfiniteQuery": {
  "keys": ["getGenereted"],
  "keepUseQuery": true
}
```

---

## FAQ

<details>
<summary>Why the `infinit` spelling?</summary>
It mirrors the original CLI option (<code>--infinit</code>) for backward compatibility. Both <code>infinit</code> **and** <code>infinite</code> are accepted, but the generator always emits <code>infinit</code> to avoid a breaking change.
</details>

<details>
<summary>How do I migrate existing code?</summary>
No change is necessary unless you want infinite behaviour. Simply pass <code>{ infinit: true }</code> where appropriate.
</details>

<details>
<summary>Can I customise the page param name?</summary>
Yes – React ‑Query’s <code>getNextPageParam</code> option is fully exposed.
</details>

---

## Changelog (`v7.0.0`)

* ✨ **Conditional `useQuery` / `useInfiniteQuery` hooks**.
* 🦩 Improved type safety for optional params.
* 🏷  ESM build now marked as <code>type": "module"</code>.



## Stories

[why-you-should-use-swagger-typescript-for-generate-apis-code](https://medium.com/@hosseinm.developer/why-you-should-use-swagger-typescript-for-generate-apis-code-63eb8623fef8?source=friends_link&sk=2aa0e2d30b3be158d18c1feb4e12d4a6)
