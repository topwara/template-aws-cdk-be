// Lib
import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb'

// Include
import { STAGE } from '../src/config/index'
import { TDynamoDbEnvTable, TDynamoDbStack, TDynamoDbTable } from '../src/config/type'

//
export const DynamoDbStack = (scope: Construct): TDynamoDbStack => {
  const tableName = (name: string): string => `${STAGE}-${name}-dbStack`

  // ========== Declare : DynamoDb Table ==========
  const userTable = new Table(scope, tableName('userTable'), {
    removalPolicy: cdk.RemovalPolicy.DESTROY,
    billingMode: BillingMode.PAY_PER_REQUEST,
    partitionKey: {
      name: 'companyID',
      type: AttributeType.STRING,
    },
    sortKey: {
      name: 'userID',
      type: AttributeType.STRING,
    },
  })

  const postTable = new Table(scope, tableName('postTable'), {
    removalPolicy: cdk.RemovalPolicy.DESTROY,
    billingMode: BillingMode.PAY_PER_REQUEST,
    partitionKey: {
      name: 'companyID',
      type: AttributeType.STRING,
    },
    sortKey: {
      name: 'postID',
      type: AttributeType.STRING,
    },
  })

  // ==========           Return         ==========
  const tableList: TDynamoDbTable = {
    userTable,
    postTable,
  }

  const envTableList: TDynamoDbEnvTable = {
    USER_TABLE_NAME: userTable.tableName,
    POST_TABLE_NAME: postTable.tableName,
  }

  return { tableList, envTableList }
}
