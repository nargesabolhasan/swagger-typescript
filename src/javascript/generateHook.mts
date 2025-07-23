import {
  getDefineParam,
  getParamString,
  getSchemaName,
  getTsType,
  toPascalCase,
} from "./utils.mjs";
import { ApiAST, Config, TypeAST } from "../types.mjs";
import {
  DEPRECATED_WARM_MESSAGE,
  getHooksFunctions,
  getHooksImports,
} from "./strings.mjs";
import { getJsdoc } from "../utilities/jsdoc.mjs";
import { isAscending, isMatchWholeWord } from "../utils.mjs";
import { getParamsString } from "./files/getParamsString.mjs";

const allowedPageParametersNames = ["page", "pageno", "pagenumber", "offset"];
const INFINITY_PARAMS = "infinit";

function generateHook(
  apis: ApiAST[],
  types: TypeAST[],
  config: Config,
): string {
  let code = getHooksImports({
    hasInfinity: !!config.useInfiniteQuery?.length,
  });

  const getUseInfiniteQueryMeta = (hookName: string, serviceName: string) => {
    const meta = (config.useInfiniteQuery || []).find((item) => {
      if (typeof item === "string") {
        return (
          item.toLowerCase() === serviceName.toLowerCase() ||
          item.toLowerCase() === hookName.toLowerCase()
        );
      }
      return item.keys.some(
        (key) =>
          key.toLowerCase() === serviceName.toLowerCase() ||
          key.toLowerCase() === hookName.toLowerCase(),
      );
    });

    if (!meta)
      return { supportsPagination: false, keepUseQuery: false } as const;

    if (typeof meta === "string")
      return { supportsPagination: true, keepUseQuery: false } as const;

    return {
      supportsPagination: true,
      keepUseQuery: !!meta.keepUseQuery,
    } as const;
  };

  apis = apis.sort(({ serviceName }, { serviceName: _serviceName }) =>
    isAscending(serviceName, _serviceName),
  );

  let showSwitchPaginationTypes: boolean = false;

  const apisCode = apis.reduce((prev, api) => {
    const {
      summary,
      deprecated,
      serviceName,
      queryParamsTypeName,
      pathParams,
      requestBody,
      headerParams,
      isQueryParamsNullable,
      isHeaderParamsNullable,
      responses,
      method,
      queryParameters,
    } = api;

    const hookName = `use${toPascalCase(serviceName)}`;
    const { supportsPagination, keepUseQuery } = getUseInfiniteQueryMeta(
      hookName,
      serviceName,
    );

    const isGet =
      supportsPagination ||
      method === "get" ||
      config.useQuery?.some(
        (name) =>
          name.toLowerCase() === serviceName.toLowerCase() ||
          name.toLowerCase() === hookName.toLowerCase(),
      );

    const TData = `${responses ? getTsType(responses, config) : "any"}`;
    const TQueryFnData = `SwaggerResponse<${TData}>`;
    const TError = "RequestError | Error";

    const getQueryParamName = (
      name: string,
      nullable: boolean = isQueryParamsNullable,
      isPartial?: boolean,
    ) =>
      queryParamsTypeName
        ? `${getParamString(
            name,
            !nullable,
            queryParamsTypeName,
            undefined,
            isPartial,
          )},`
        : "";

    const TVariables = `
      ${pathParams
        .map(({ name, required, schema, description }) =>
          getDefineParam(name, required, schema, config, description),
        )
        .join(",")} 
      ${pathParams.length > 0 ? "," : ""}
      ${
        requestBody
          ? `${getDefineParam("requestBody", true, requestBody, config)},`
          : ""
      }
      ${getQueryParamName("queryParams")}
      ${
        headerParams
          ? `${getParamString(
              "headerParams",
              !isHeaderParamsNullable,
              headerParams as string,
            )},`
          : ""
      } 
    `
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line)
      .join("\n");

    const deps = `[${serviceName}.key,${
      pathParams.length ? `${pathParams.map(({ name }) => name)},` : ""
    }
      ${requestBody ? "requestBody," : ""}
      ${queryParamsTypeName ? "queryParams," : ""}
      ${headerParams ? "headerParams," : ""}]`;

    const hasSwitchablePagination = supportsPagination && keepUseQuery;

    showSwitchPaginationTypes = hasSwitchablePagination;

    const getOptionsType = () => {
      if (!isGet) {
        return TVariables
          ? `SwaggerTypescriptUseMutationOptions<${TData}, {${TVariables}}, TExtra>`
          : `SwaggerTypescriptUseMutationOptionsVoid<${TData}, TExtra>`;
      }

      if (hasSwitchablePagination) {
        return `({
      ${INFINITY_PARAMS}?: Infinit;
    } & (
      SwaggerTypescriptUseQueryOptions<${TData}> |
      UseInfiniteQueryOptions<${TQueryFnData}, ${TError}>
    ))`;
      }

      if (supportsPagination) {
        return `UseInfiniteQueryOptions<${TQueryFnData}, ${TError}>`;
      }

      return `SwaggerTypescriptUseQueryOptions<${TData}>`;
    };
    const responseTypes = () => {
      if (hasSwitchablePagination) {
        return `: QueryResult<Infinit>`;
      }
      return "";
    };

    const params = [
      `${isGet ? TVariables : ""}`,
      `options?: ${getOptionsType()},`,
      `${isGet ? `configOverride?: AxiosRequestConfig,` : ""}`,
    ];

    let result =
      prev +
      `
${getJsdoc({
  description: summary,
  deprecated: deprecated ? DEPRECATED_WARM_MESSAGE : undefined,
})}`;

    result += `export const ${hookName} =${
      hasSwitchablePagination ? " <Infinit extends boolean = false> " : ""
    }`;
    if (!isGet) result += `<TExtra>`;

    result += `(
      ${params.join("\n      ")}
    ) ${responseTypes()}=> {`;

    if (isGet) {
      result += `
      const { key, fun } = ${hookName}.info(${getParamsString({
        override: false,
        pathParams,
        requestBody,
        queryParamsTypeName,
        supportsPagination,
        headerParams,
      })} configOverride);
      `;

      const shouldUseInfiniteCondition = supportsPagination
        ? hasSwitchablePagination
          ? `${INFINITY_PARAMS}`
          : "true"
        : "false";

      const infiniteBlock = (hasEnable: boolean) => /* ts */ `
        const {
          data: { pages } = {},
          data,
          ...rest
        } = useInfiniteQuery({
        ${hasEnable ? `enabled: options?.${INFINITY_PARAMS},` : ""}
          queryKey: key,
          queryFn: ({ pageParam }) =>
            fun({
              ${
                queryParameters.find(({ name }) =>
                  allowedPageParametersNames.includes(name.toLowerCase()),
                )?.name ?? "page"
              }: pageParam,
            }),
          initialPageParam: 1,
          getNextPageParam: (_lastPage, allPages) => allPages.length + 1,
           ...(options as any),
        });

        const list = useMemo(() => paginationFlattenData(pages), [pages]);
        const total = getTotal(pages);
        const hasMore = useHasMore(pages, list, queryParams);
        ${hasEnable ? `if (options?.${INFINITY_PARAMS})` : ""}
        return { ...rest, data, list, hasMore, total } as const;
`;

      if (shouldUseInfiniteCondition === "true") {
        result += infiniteBlock(false);
      } else if (shouldUseInfiniteCondition === INFINITY_PARAMS) {
        result += `
${infiniteBlock(true)}

return useQuery({ enabled: !options?.${INFINITY_PARAMS}, queryKey: key, queryFn: fun, ...options });
`;
      } else {
        result += `
return useQuery({ queryKey: key, queryFn: fun, ...options });
`;
      }
    } else {
      result += `return useMutation<SwaggerResponse<TData>, RequestError | Error, {${TVariables}}>({
        mutationFn: (_o) => {
          const { ${getParamsString({
            pathParams,
            requestBody,
            queryParamsTypeName,
            supportsPagination,
            headerParams,
            override: false,
          })} configOverride } = _o || {};
          return ${serviceName}(${getParamsString({
            pathParams,
            requestBody,
            queryParamsTypeName,
            supportsPagination,
            headerParams,
            override: false,
          })} configOverride);
        },
        ...options
      });`;
    }

    result += `
    };
    `;

    if (isGet) {
      const infoParams = params
        .filter((p) => !p.trim().startsWith("options?:"))
        .join("");

      result += `
${hookName}.info = (${infoParams}) => {
  return {
    key: ${deps} as QueryKey,
    fun: (${
      supportsPagination
        ? getQueryParamName("_param", true, true).replace(/,$/, "")
        : ""
    }) =>
      ${serviceName}(${getParamsString({
        pathParams,
        requestBody,
        queryParamsTypeName,
        supportsPagination,
        headerParams,
        override: true,
      })} configOverride),
  } as const;
};

${hookName}.prefetch = (
  client: QueryClient,
  ${params.join("\n  ")}
) => {
  const { key, fun } = ${hookName}.info(${getParamsString({
    pathParams,
    requestBody,
    queryParamsTypeName,
    supportsPagination,
    headerParams,
    override: false,
  })} configOverride);

  return client.getQueryData(key)
    ? Promise.resolve()
    : client.prefetchQuery({ queryKey: key, queryFn: () => fun(), ...options });
};
`;
    }

    return result;
  }, "");

  code +=
    types
      .sort(({ name }, { name: _name }) => isAscending(name, _name))
      .reduce((prev, { name: _name }) => {
        const name = getSchemaName(_name);
        if (!isMatchWholeWord(apisCode, name)) return prev;
        return prev + ` ${name},`;
      }, "import type {") + ` } from "./types"\n`;

  code +=
    apis.reduce((prev, { serviceName }) => {
      return prev + ` ${serviceName},`;
    }, "import {") + ` } from "./services"\n`;

  code += getHooksFunctions({ hasInfinity: !!config.useInfiniteQuery?.length });

  code += `
export export type SwaggerTypescriptMutationDefaultParams<TExtra> = {
  _extraVariables?: TExtra;
  configOverride?: AxiosRequestConfig;
};

export type SwaggerTypescriptUseQueryOptions<TData> = Omit<
  UseQueryOptions<SwaggerResponse<TData>, RequestError | Error>,
  "queryKey"
>;

export type SwaggerTypescriptUseMutationOptions<TData, TRequest, TExtra> = UseMutationOptions<
  SwaggerResponse<TData>,
  RequestError | Error,
  TRequest & SwaggerTypescriptMutationDefaultParams<TExtra>
>;

export type SwaggerTypescriptUseMutationOptionsVoid<TData, TExtra> = UseMutationOptions<
  SwaggerResponse<TData>,
  RequestError | Error,
  SwaggerTypescriptMutationDefaultParams<TExtra> | void
>;
${showSwitchPaginationTypes && `export type InfiniteQueryResult = 
  ReturnType<typeof useInfiniteQuery>
  & {
  list: unknown[];
  total: number;
  hasMore: boolean
};

export type StandardQueryResult = ReturnType<typeof useQuery>;

export type QueryResult<Infinit extends boolean> = Infinit extends true ? InfiniteQueryResult : StandardQueryResult
`}
`;

  code += apisCode;

  return code;
}

export { generateHook };
