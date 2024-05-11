import isEmpty from "lodash/isEmpty";

import {
  baseApiKeyList,
  IGNORE_API_NAME,
  MARKET_HK,
  MARKET_HS,
  MARKET_US,
  MARKET_US_OPTION,
  Api,
  ApiName,
  OpenApi,
} from "./types";

// 市场集合
const marketSet = new Set([MARKET_HK, MARKET_US, MARKET_HS, MARKET_US_OPTION]);

/**
 * 解析OpenAPI文档
 */
export class ParseOpenAPI {
  static parse(jsonStr: string) {
    const api: Api[] = [];

    const openApi = JSON.parse(jsonStr) as OpenApi;

    // 设置api版本
    const apiVersion = openApi.info.version;

    const { paths } = openApi;

    const apiKeyList = [...baseApiKeyList];
    // 按照apiPath进行处理
    Object.entries(paths).forEach(([path, pathObj]) => {
      const pathList = path.split("/");

      // 查找版本号位置
      const vIndex = pathList.findIndex((p) => /^v\d+$/.test(p));
      // 无版本号不做处理
      if (vIndex < 0) return;

      // 获取当前api对应的方法（get/post）
      const method: string = Object.keys(pathObj)[0];

      // 获取当前api对应市场
      let market = "";
      for (let i = 0; i < vIndex; i += 1) {
        if (marketSet.has(pathList[i])) {
          market = pathList[i];
          // 期权特殊处理
          if (pathList[i - 1] === "option") {
            market += "Option";
          }
          break;
        }
      }

      const apiPathList = pathList.slice(vIndex + 1);

      /**
       * 获取api前缀路径
       *
       * 如 /stock/hk/ss/v1/etf/list
       * apiPrefix = stock/hk/ss
       */
      const apiPrefix = pathList.slice(1, vIndex).join("/");
      /**
       * 获取api真实路径
       *
       * 如 /stock/hk/ss/v1/etf/list
       * apiPath = etf/list
       */
      const apiPath = pathList.slice(vIndex + 1).join("/");

      // 获取api名称
      //! TODO: 第一优先采用 URL 无关的请求键生成策略，目前碍于现有设计，不得不与 URL 硬性关联
      let apiName = `${apiPathList.join("_")}${
        market ? `_${market}` : ""
      }` as ApiName;

      /**
       * TODO 临时做法，手动汇总f10项目接口
       *
       * 手动汇总f10项目相关接口（包括f10接口和非f10接口），自动在apiName
       * 上拼接【f10】字符
       */
      if (apiPrefix.includes("/f10")) {
        apiName = `f10_${apiName}`;
      }

      // apiName在忽略列表中，终止当前api处理
      if (IGNORE_API_NAME.has(apiName)) return;

      // 将当前apiName插入到apiKeyList
      apiKeyList.push(apiName);

      const apiBody = pathObj[method as keyof typeof pathObj];

      // 获取api url参数
      const parameters: Api["parameters"] = {};
      const { summary, description } = apiBody;
      const apiParams = apiBody.parameters;
      apiParams?.forEach(({ name, description: des, required }) => {
        parameters[name] = {
          description: des,
          required,
        };
      });

      // 获取api requestBody参数
      let requestBody: Api["requestBody"] = {};

      const schemaObj =
        apiBody.requestBody?.content["application/json"]?.schema;
      // 获取实体类型结构索引key
      const key = schemaObj?.$ref?.split("/")?.pop();
      // 获取实体类型
      const _properties = schemaObj?.properties;
      // schema同级的example
      const example = apiBody.requestBody?.content["application/json"]?.example;

      /**
       * properties存在时，优先取properties的值
       *
       * key存在时，从实体类型结构表中取对应的实体结构
       * - 注意此时的key为假设为 SymbolReq%5B%E8%AF%81%E5%88%B8%E4%BB%A3%E7%A0%81%E8%AF%B7%E6%B1%82%E7%B1%BB%5D
       * - 但是实际的key为 SymbolReq[证券代码请求类]
       * - 所以需要decodeURI(key)
       *
       * 都不存在时，尝试读取example
       */
      if (!isEmpty(_properties)) {
        requestBody = _properties;
      } else if (key) {
        const obj = openApi.components.schemas[decodeURI(key)];
        const requiredList = new Set(obj?.required ?? []);
        const { properties } = obj;
        Object.keys(properties).forEach((k) => {
          if (!properties[k]) return;
          requestBody[k] = {
            ...properties[k],
            required: requiredList.has(k),
          };
        });
      } else if (example) {
        Object.entries(example).forEach(([k, val]) => {
          requestBody[k] = {
            type: typeof val,
            description: "",
            examples: [val],
          };
        });
      }

      // TODO 解析response类型

      api.push({
        apiName,
        summary,
        description,
        market,
        method,
        apiPrefix,
        apiPath,

        parameters,
        requestBody,
        response: {},
      });

      // console.log(pathList);
    });

    return {
      api,
      apiVersion,
      apiKeyList,
    };
  }
}
