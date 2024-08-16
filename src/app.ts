// Lib

// Include
import { APP_NAME, STAGE } from './config'
import { TDynamoDbEnvTable } from './config/type'
import { lambdaHandler as postHandler } from './controllers/post'
import { lambdaHandler as helloHandler } from './controllers/hello'

// =============================================================

// When develop in Local , Can't access to dynamoDB because it contain LogicalGenratedID
// Do this , After deploy dynamoDB to AWS , Copy tableName follow STAGE and paste in Obj below

const table = {
  dev: {
    POST_TABLE_NAME: 'postTabledbStack6EBE53B4-WE8E1QLIZJ0A',
    USER_TABLE_NAME: 'userTabledbStackBEB9C621-1TXCUE7AUMASI',
  },
  prod: {
    POST_TABLE_NAME: '',
    USER_TABLE_NAME: '',
  },
}[STAGE] as Record<keyof TDynamoDbEnvTable, string>

for (const key in table) process.env[`${key}`] = `${APP_NAME}-${STAGE}` + table[key as keyof TDynamoDbEnvTable]

// =============================================================

const hello = async (request: any): Promise<any> => {
  return (await helloHandler(request)).body
}

const post = async (request: any): Promise<any> => {
  return (await postHandler(request)).body
}

export { hello, post }
