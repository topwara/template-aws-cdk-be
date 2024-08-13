// Lib
import path = require('path')
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs'

// Include

//
export const helloHandler: NodejsFunctionProps = {
  entry: path.join(__dirname, `./hello.ts`),
}

export const postHandler: NodejsFunctionProps = {
  entry: path.join(__dirname, `./post.ts`),
}
