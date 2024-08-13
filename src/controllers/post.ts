// Lib
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

// Include
import db from '../config/db'
import { envTable } from '../config/type'
import { EResponseStatus, responseFormatHttp } from '../utils/http'
import { dynamodbUpdate, dynamoDBUpdateFromAttributes } from '../utils/dyanamoDb'

// => post
export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('---------- START | postHandler ----------')

  const env = envTable(process.env)
  if (typeof env === 'string') return responseFormatHttp(EResponseStatus.ERROR, { error: env })

  try {
    const dateNow = new Date().toISOString()

    const params: DocumentClient.UpdateItemInput = {
      TableName: env.POST_TABLE_NAME as string,
      Key: {
        companyID: 'DAB_01',
        postID: 'POS_01',
      },
      ...dynamoDBUpdateFromAttributes({ createdAt: dateNow }, ['companyID', 'postID']),
    }

    await dynamodbUpdate(db, params)

    console.log('----------  END  | postHandler | Success ----------')
    return responseFormatHttp(EResponseStatus.SUCCESS, { msg: '👍 Success update postTable' })
  } catch (error) {
    console.log('----------  END  | postHandler | Error ----------', error)
    return responseFormatHttp(EResponseStatus.ERROR, { error: error })
  }
}
