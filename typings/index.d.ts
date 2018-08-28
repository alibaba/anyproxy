
/// <reference types="node" />

declare module NodeJS {
  interface Global {
    _throttle: any;
  }
}

declare interface AnyProxyConfig {
  port: string; // 代理监听端口
  httpServerPort: string; // web server 的端口
  forceProxyHttps: boolean;
  dangerouslyIgnoreUnauthorized: boolean; // 是否忽略https证书
  wsIntercept: boolean; // 是否代理websocket
  chunkSizeThreshold: number; // throttle的配置
}

declare interface AnyProxyRule {
  summary?: string,
  beforeSendRequest?: Function,
  beforeSendResponse?: Function,
  beforeDealHttpsRequest?: Function,
  onError?: Function,
  onConnectError?: Function
}

declare namespace AnyProxyRecorder {
  type ResponseHeader = any; // 暂时无法引入http模块，会导致
  export type WsResourceInfo = {
    time: number,
    message: string,
    isToServer: boolean
  };

  export type ResourceInfo = {
    wsMessages?: Array<WsResourceInfo>,
    statusCode?: number,
    resHeader?: ResponseHeader,
    host?: string,
    protocol?: string,
    method?: string,
    path?: string,
    url?: string,
    startTime?: number,
    endTime?: number,
    req?: any,
    reqBody?: string,
    res?: {
      statusCode: number,
      headers: ResponseHeader
    },
    resBody?: string,
    length?: number
  };
}

// The request detail object AnyProxy used internally
declare interface AnyProxyRequestDetail {
  protocol?: string;
  requestOptions?: any;
  requestData?: Buffer;
  url?: string;
  _req?: any;
  _directlyPassToRespond?: boolean;
  response?: AnyProxyResponse; // exists when gen the response directly from request
}

declare interface AnyProxyResponse {
  statusCode: number,
  header: OneLevelObjectType;
  body: string | Buffer;
  rawBody: Buffer;
}

declare interface AnyProxyReponseDetail {
  response: AnyProxyResponse,
  _res: any;
  _directlyPassToRespond?: boolean; // no need to send the respnose out
}

declare interface OneLevelObjectType {
  [key: string]: string | boolean | number
}

declare interface IExecScriptResult {
  status: number;
}