// Lib
import path = require('path')
import { Duration } from 'aws-cdk-lib'

// Include

//
export const graphqlNonAuthHandler = {
  entry: path.join(__dirname, `./handler.ts`),
  description: 'Graphql paths of Get and Post',
}
