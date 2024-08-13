import * as cdk from 'aws-cdk-lib'

export type TDynamoDbTable = {
  userTable: cdk.aws_dynamodb.Table
  postTable: cdk.aws_dynamodb.Table
}

export type TDynamoDbEnvTable = {
  USER_TABLE_NAME: string
  POST_TABLE_NAME: string
}

export type TDynamoDbStack = {
  tableList: TDynamoDbTable
  envTableList: TDynamoDbEnvTable
}

export const envTable = (processEnv: NodeJS.ProcessEnv): string | TDynamoDbEnvTable => {
  const env = processEnv as TDynamoDbEnvTable

  if (!env.USER_TABLE_NAME) return 'Need ENV Var USER_TABLE_NAME'
  if (!env.POST_TABLE_NAME) return 'Need ENV Var USER_TABLE_NAME'

  const tableResponse: TDynamoDbEnvTable = {
    USER_TABLE_NAME: env.USER_TABLE_NAME,
    POST_TABLE_NAME: env.POST_TABLE_NAME,
  }

  return tableResponse
}
