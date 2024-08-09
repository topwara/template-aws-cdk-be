// Lib
import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'

// Include
import { LambdaStack } from './lambda-stack'
import { DynamoDbStack } from './dynamoDb-stack'
import { ApigatewayStack } from './apigateway-stack'
import { graphqlNonAuthHandler } from '../src/graphqlNonAuth/index'
import { helloHandler, postHandler } from '../src/controllers/index'

//
export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // Setup : ApiGateway
    const api = new ApigatewayStack(this)

    // Setup : DynamoDB
    const db = DynamoDbStack(this)

    // Setup : Lambda functions
    const hello = new LambdaStack(this, db, helloHandler, 'hello')
    const post = new LambdaStack(this, db, postHandler, 'post')
    const graphqlNonAuth = new LambdaStack(this, db, graphqlNonAuthHandler, 'graphqlNonAuth')

    // Setup : Lambda functions + ApiGateway (Path)
    api.addIntegration(hello, '/hello')
    api.addIntegration(post, '/post')
    api.addIntegration(graphqlNonAuth, '/graphqlNonAuth')
  }
}
