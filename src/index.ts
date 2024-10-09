// Lib
import Fastify from 'fastify'
import { ApolloServer, BaseContext } from '@apollo/server'
import { fastifyApolloHandler } from '@as-integrations/fastify'
import { fastifyApolloDrainPlugin } from '@as-integrations/fastify'

// Include
import db from './config/db'
import * as appHandlers from './app'
import authMiddleware from './middleware/handler'
import { typeDefs as typeDefsNonAuth, resolvers as resolversNonAuth } from './graphqlNonAuth/handler'

const start = async () => {
  const fastify = Fastify()
  const port = 3000
  const paths: string[] = [`http://localhost:${port}/graphqlNonAuth`]

  // ===== Start add graphqlNonAuth to use in Offline =====
  const apollo = new ApolloServer<BaseContext>({
    typeDefs: typeDefsNonAuth,
    resolvers: resolversNonAuth,
    plugins: [fastifyApolloDrainPlugin(fastify)],
  })

  await apollo.start()

  fastify.route({
    url: '/graphqlNonAuth',
    method: ['POST', 'GET', 'OPTIONS'],
    handler: fastifyApolloHandler(apollo, {
      context: async (contextRaw: any): Promise<any> => {
        const token = contextRaw.raw.headers.authorization
        const input = contextRaw.body.variables

        const items = { headers: { Authorization: token } }
        const auth = authMiddleware(items as any)

        return { event: input, lambdaContext: null, db: db, tokenPayload: auth }
      },
    }),
  })
  // =====  End  add graphqlNonAuth to use in Offline =====

  Object.entries(appHandlers).map(([name, Handler]) => {
    paths.push(`http://localhost:${port}/${name}`)
    return fastify.all(`/${name}`, Handler)
  })

  fastify.listen({ port: port, host: '0.0.0.0' }, (err) => {
    if (err) console.log(`🔴 server error ${err}`), process.exit(1)
    console.log('---------------------------------------')
    console.log('👽 paths => ', JSON.stringify(paths, null, 2))
    console.log('---------------------------------------')
  })
}

start()
