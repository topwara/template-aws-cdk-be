// Lib
import { GraphQLJSON } from 'graphql-scalars'
import { IResolvers } from '@graphql-tools/utils'
import { ApolloServer } from 'apollo-server-lambda'
import { mergeTypeDefs } from '@graphql-tools/merge'

// Include
import db from '../config/db'
import { IGQLContext } from '../utils/type'
import authMiddleware from '../middleware/handler'

// ========== ========== ========== ========== ==========

// GraphQl Schema
import IndexSDL from './typedefs/index'
import GlobalSDL from './typedefs/Global'
import HelloSDL from './typedefs/Hello'

// GraphQl Resolver
import HelloResolver from './resolvers/Hello.resolver'

// ========== ========== ========== ========== ==========

export const typeDefs = mergeTypeDefs([IndexSDL, GlobalSDL, HelloSDL])

export const resolvers = [HelloResolver as IResolvers, { JSON: GraphQLJSON }]

const server = new ApolloServer({
  typeDefs: typeDefs,
  resolvers: resolvers,
  introspection: true,
  context: ({ event, context }): IGQLContext => {
    const auth = authMiddleware(event)
    return { event: event, lambdaContext: context, db: db, tokenPayload: auth }
  },
})

const handler = server.createHandler({
  expressGetMiddlewareOptions: {
    cors: {
      origin: '*',
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['Authorization', 'X-Cache', 'x-amz-apigw-id', 'x-amzn-ErrorType', 'X-Amz-Cf-Pop', 'X-Amz-Cf-Id'],
      methods: 'GET,HEAD,PUT,POST,DELETE,OPTIONS',
    },
  },
})

export const lambdaHandler = handler
