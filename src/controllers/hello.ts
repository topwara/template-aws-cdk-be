// Lib
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

// Include
import db from '../config/db'
import { envTable } from '../config/type'
import { EResponseStatus, responseFormatHttp } from '../utils/http'
import { dynamodbUpdate, dynamoDBUpdateFromAttributes } from '../utils/dyanamoDb'

// => hello
export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('---------- START | helloHandler ----------')

  const env = envTable(process.env)
  if (typeof env === 'string') return responseFormatHttp(EResponseStatus.ERROR, { error: env })

  try {
    const dateNow = new Date().toISOString()

    const params: DocumentClient.UpdateItemInput = {
      TableName: env.USER_TABLE_NAME as string,
      Key: {
        companyID: 'DAB_01',
        userID: 'USR_01',
      },
      ...dynamoDBUpdateFromAttributes({ createdAt: dateNow }, ['companyID', 'userID']),
    }

    await dynamodbUpdate(db, params)

    console.log('----------  END  | helloHandler | Success ----------')
    return responseFormatHttp(EResponseStatus.SUCCESS, { msg: '👍 Success update userTable ⭐⭐⭐' })
  } catch (error) {
    console.log('----------  END  | helloHandler | Error ----------', error)
    return responseFormatHttp(EResponseStatus.ERROR, { error: error })
  }
}
