// 默认写入的apiKey
export const baseApiKeyList = [
  // 手动加入，新闻接口
  "hours24_news",
  "list_news",
  "info_news",

  // 手动加入，资源接口
  "send_sms_resource",

  // 手动加入，权限接口
  "login_auth",
];

/**
 * api解析时要忽略的apiName列表
 *
 * 若添加f10相关接口，填写时需要在名称前面拼接【f10】字符
 */
export const IGNORE_API_NAME = new Set([
  "utils_getAllURL_hk",
  "utils_getAllURL_hs",
  "utils_getAllURL_us",

  "pay_alipay_notify_url",
  "pay_alipay_quit_url",
  "pay_alipay_return_url",
  "pay_alipay_wapPay",
  "pay_alipay_wapPayTest",
  "pay_generate",

  "us_finance_balance-basic",
  "us_finance_cash-basic",
  "us_finance_income-basic",
  "us_finance_key-indicator",

  "product_my_buy",
  "stock_queryWeight",
  "stock_refresh",

  "f10_extend_all_hk",
  "f10_extend_all_us",
  "f10_summary_ca-repurchase_us",
  "f10_summary_forecast-eps_hk",
  "f10_summary_forecast-eps_us",
]);

// 港股市场
export const MARKET_HK = "hk";
// 美股市场
export const MARKET_US = "us";
// 沪深市场
export const MARKET_HS = "hs";
// 美股期权
export const MARKET_US_OPTION = "usOption";

export type AnyType<T = unknown> = {
  [k: string]: T;
};

export type ApiName = `${string}_${string}`;

export type OpenApi = {
  info: {
    // 文档版本
    version: string;
  };

  // api请求路径
  paths: {
    [url: string]: {
      [method in "get" | "post"]: {
        // 接口名称
        summary: string;
        // 接口描述
        description: string;

        // url请求参数
        parameters?: {
          // 参数名称
          name: string;
          // 参数描述
          description: string;
          // 是否必填
          required: boolean;
        }[];

        // body请求参数，可能没有body请求参数
        requestBody?: {
          content: {
            "application/json": {
              schema: {
                /**
                 * 请求类型数据结构的索引，到components属性下查找
                 * "$ref": "#/components/schemas/BaseSymbolReq[股票代码请求类]"
                 */
                $ref?: string;
                properties?: {
                  [prop: string]: {
                    // 该属性对应的类型
                    type: string;
                    // 该属性对应的描述
                    description: string;
                    // 是否必填
                    required?: boolean;
                    // 该属性对应的输入样例
                    examples: (string | number)[];
                  };
                };
              };
              example?: AnyType<string | number>;
            };
          };
        };

        // 响应结构
        responses: {
          "200": {
            content: {
              "*/*": {
                schema: {
                  // 此处可能直接写类型，如"object"，如果存在type则不存在$ref
                  type?: string;
                  /**
                   * 响应类型数据结构的索引，到components属性下查找
                   * "$ref": "#/components/schemas/R«long»"
                   */
                  $ref?: string;
                };
              };
            };
          };
          // 其它响应码不需要处理
        };
      };
    };
  };

  // 实体类型结构
  components: {
    schemas: {
      [key: string]: {
        required: string[];
        // 类型下的属性
        properties: {
          [prop: string]: {
            // 该属性对应的类型
            type: string;
            // 该属性对应的描述
            description: string;
            // 该属性对应的输入样例
            examples: (string | number)[];
          };
        };
      };
    };
  };
};

// 解析open api后的结构
export type Api = {
  // api名称，该名称会用作调用函数名称和事件名称
  apiName: ApiName;
  // api详细描述
  description: string;
  // api中文名称
  summary: string;
  // api所属市场，为''表示没有所属市场
  market: string;
  // api调用类型
  method: string;
  /**
   * api前缀路径
   *
   * 如 /stock/hk/ss/v1/etf/list
   * apiPrefix = stock/hk/ss
   */
  apiPrefix: string;

  /**
   * api真实路径
   *
   * 如 /stock/hk/ss/v1/etf/list
   * apiPath = etf/list
   */
  apiPath: string;

  // url请求参数
  parameters: {
    [param: string]: {
      description: string;
      required: boolean;
    };
  };

  // body请求参数
  requestBody: {
    [prop: string]: {
      // 该属性对应的类型
      type: string;
      // 该属性对应的描述
      description: string;
      // 是否必填
      required?: boolean;
      // 该属性对应的输入样例
      examples?: (string | number)[];
    };
  };

  // 响应参数
  response: OpenApi["components"]["schemas"]["*"]["properties"];
};
