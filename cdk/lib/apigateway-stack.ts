// Lib
import { Construct } from 'constructs'
import { RemovalPolicy } from 'aws-cdk-lib'
import { IFunction } from 'aws-cdk-lib/aws-lambda'
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs'
import { LambdaIntegration, LogGroupLogDestination, MethodOptions, RestApi } from 'aws-cdk-lib/aws-apigateway'

// Include
import { STAGE } from '../src/config/index'

//
export class ApigatewayStack extends RestApi {
  constructor(scope: Construct) {
    super(scope, 'ApiGateway', {
      restApiName: 'template-aws-cdk-be-apigateway',
      cloudWatchRole: true,
      deployOptions: {
        stageName: STAGE,
        accessLogDestination: new LogGroupLogDestination(
          new LogGroup(scope, 'ApiLogGroup', {
            logGroupName: 'api_gateway',
            retention: RetentionDays.ONE_DAY,
            removalPolicy: RemovalPolicy.DESTROY,
          }),
        ),
      },
    })
  }

  addIntegration(lambda: IFunction, path: string) {
    const resource = this.root.resourceForPath(path)

    const lambdaOptions: MethodOptions = {
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Headers': true,
            'method.response.header.Access-Control-Allow-Methods': true,
            'method.response.header.Access-Control-Allow-Credentials': true,
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
      ],
    }

    resource.addMethod('POST', new LambdaIntegration(lambda), lambdaOptions)

    if (path === '/graphqlNonAuth' || path === 'graphql') {
      resource.addMethod('GET', new LambdaIntegration(lambda), lambdaOptions)
    }
  }
}
