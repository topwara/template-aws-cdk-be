// Lib
import fastify from 'fastify'

// Include
import * as appHandlers from './app'

//
const app = fastify()
const port = 3000

Object.entries(appHandlers).map(([name, Handler]) => app.all(`/${name}`, Handler))

app.listen({ port: port, host: '0.0.0.0' }, (err, address) => {
  if (err) console.log(`🔴 server error ${err}`), process.exit(1)
  console.log(`🟢 server listening on http://localhost:${port}`)
})
