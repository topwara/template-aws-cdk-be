// Lib
import { Duration } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { RetentionDays } from 'aws-cdk-lib/aws-logs'
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'

// Include
import { TDynamoDbStack } from '../src/config/type'

//
export class LambdaStack extends NodejsFunction {
  constructor(scope: Construct, dbStack: TDynamoDbStack, handler: any, filename: string) {
    //
    const { envTableList, tableList } = dbStack
    const { userTable, postTable } = tableList

    super(scope, filename, {
      memorySize: 1024,
      timeout: Duration.seconds(30),
      handler: 'lambdaHandler',
      environment: envTableList,
      runtime: Runtime.NODEJS_18_X,
      architecture: Architecture.ARM_64,
      logRetention: RetentionDays.ONE_DAY,
      ...handler,
    })

    this.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'dynamodb:Scan',
          'dynamodb:Get*',
          'dynamodb:Put*',
          'dynamodb:Query',
          'dynamodb:Update*',
          'dynamodb:Delete*',
          'dynamodb:BatchGet*',
          'dynamodb:BatchWrite*',
          'dynamodb:DescribeTable',
          'dynamodb:DescribeStream',
        ],
        resources: [userTable.tableArn + '*', postTable.tableArn + '*'],
      }),
    )
  }
}
