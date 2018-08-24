declare interface AnyProxyConfig {
  port: number
}
declare interface AnyProxyRule {
  summary?: string,
  beforeSendRequest?: Function,
  beforeSendResponse?: Function,
  beforeDealHttpsRequest?: Function,
  onError?: Function,
  onConnectError?: Function
}