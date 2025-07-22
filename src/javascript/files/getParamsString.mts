import { Parameter, Schema } from "../../types.mjs";

type Parameters = {
  pathParams: Parameter[];
  requestBody: Schema | undefined;
  queryParamsTypeName: string | false;
  supportsPagination: boolean;
  headerParams: string | Parameter[];
  override?: boolean;
};

const getParamsString = ({
  pathParams,
  requestBody,
  queryParamsTypeName,
  supportsPagination,
  headerParams,
  override = false,
}: Parameters) => ` ${
  pathParams.length ? `${pathParams.map(({ name }) => name)},` : ""
}
      ${requestBody ? "requestBody," : ""}
      ${
        queryParamsTypeName
          ? supportsPagination && override
            ? `{
                  ..._param,
                  ...queryParams,
                },`
            : "queryParams,"
          : ""
      }
      ${headerParams ? "headerParams," : ""}`;

export { getParamsString };
