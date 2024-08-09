// Lib
import { IResolvers } from '@graphql-tools/utils'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

// Include
import { envTable } from '../../config/type'
import { IGQLContext } from '../../utils/type'
import { Hello, MutationCreateHelloArgs, MutationHello } from '../generated'
import { dynamodbUpdate, dynamoDBUpdateFromAttributes } from '../../utils/dyanamoDb'
import { EResponseStatus, responseFormatGraphQL, ResponseTypeCode } from '../../utils/http'

const rootQuery = {
  //
  hello: async (_parent: any, _args: any, { db, tokenPayload }: IGQLContext) => {
    console.log('===== START : hello           =====')

    const tables = envTable(process.env)
    if (typeof tables === 'string') throw new Error(tables as string)

    try {
      const dateNow = new Date().toISOString()

      const params: DocumentClient.UpdateItemInput = {
        TableName: tables.USER_TABLE_NAME,
        Key: { companyID: 'DAB_01', userID: 'USR_01' },
        ...dynamoDBUpdateFromAttributes({ createdAt: dateNow, msg: `${Math.random()}` }, ['companyID', 'userID']),
      }
      await dynamodbUpdate(db, params)

      const response: Hello = {
        __typename: 'Hello',
        res_code: ResponseTypeCode[EResponseStatus.SUCCESS],
        res_desc: EResponseStatus.SUCCESS,
        msg: `Success to update table - USER`,
      }

      console.log('=====  END  : hello : Success =====')
      return response
    } catch (error) {
      console.log('=====  END  : hello : Error   =====', error)
      return responseFormatGraphQL(EResponseStatus.ERROR, { error: error, __typename: 'Error' })
    }
  },
}

const rootMutation = {
  //
  createHello: async (_parent: any, { input }: MutationCreateHelloArgs, { db, tokenPayload }: IGQLContext) => {
    console.log('===== START : createHello           =====')

    const tables = envTable(process.env)
    if (typeof tables === 'string') throw new Error(tables as string)

    try {
      const dateNow = new Date().toISOString()

      const response: MutationHello = {
        __typename: 'MutationHello',
        res_code: ResponseTypeCode[EResponseStatus.SUCCESS],
        res_desc: EResponseStatus.SUCCESS,
        msg: input.msg + `ส่งกลับคืน : ${dateNow}`,
      }

      console.log('=====  END  : createHello : Success =====')
      return response
    } catch (error) {
      console.log('=====  END  : createHello : Error   =====', error)

      return responseFormatGraphQL(EResponseStatus.ERROR, { error: error, __typename: 'Error' })
    }
  },
}

const Resolver: IResolvers = {
  Query: rootQuery,
  Mutation: rootMutation,
}
export default Resolver
