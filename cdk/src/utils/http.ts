import { TDynamoDbEnvTable } from '../config/type'

export const ACCESS_CONTROL_ALLOW_HEADERS = {
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
}

export type ResponseFormat<T> = {
  res_code: string
  res_desc: string
} & T

export enum EResponseStatus {
  'SUCCESS' = 'success',
  'WARNING' = 'warning',
  'ERROR' = 'error',
}

export const ResponseTypeCode = {
  [EResponseStatus.SUCCESS]: '00',
  [EResponseStatus.WARNING]: '98',
  [EResponseStatus.ERROR]: '99',
}

// Response Format : for Http
export const responseFormatHttp = <T>(status: EResponseStatus, data: T & any): ResponseFormat<any> => {
  return {
    statusCode: status === EResponseStatus.ERROR ? 400 : 200,
    headers: ACCESS_CONTROL_ALLOW_HEADERS,
    body: JSON.stringify({
      res_code: ResponseTypeCode[status],
      res_desc: status !== EResponseStatus.SUCCESS ? data.error : status,
      ...data,
    }),
  }
}

// Response Format : for GraphQL
export const responseFormatGraphQL = <T>(status: EResponseStatus, data: T & any): ResponseFormat<any> => {
  return {
    res_code: ResponseTypeCode[status],
    res_desc: status !== EResponseStatus.SUCCESS ? data.error : status,
    ...data,
  }
}
