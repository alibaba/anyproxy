
/// <reference types="node" />

declare module NodeJS {
  interface Global {
    _throttle: any;
  }
}

declare interface AnyProxyWebInterfaceConfig {
  webPort?: number;
}

declare interface AnyProxyConfig {
  port?: string; // port of the proxy server
  httpServerPort?: string; // web server 的端口
  type?: 'http' | 'https'; // type of the proxy server
  forceProxyHttps?: boolean; // proxy https also
  dangerouslyIgnoreUnauthorized?: boolean; // should ignore
  wsIntercept?: boolean; // should proxy websocket
  throttle?: string; // speed limit in kb/s
  hostname?: string; // the hostname of this proxy, default to 'localhost'
  recorder?: any; // A Recorder instance
  silent?: boolean; // if keep the console silent
  rule?: any; // rule module to use
  webInterface?: AnyProxyWebInterfaceConfig;
}

declare interface AnyProxyRule {
  summary?: string | Function,
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
  stdout?: string;
}

declare module "*.json" {
  const value: any;
  export default value;
}