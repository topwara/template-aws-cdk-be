import gql from 'graphql-tag'

export default gql`
  type Query {
    hello: HelloPayload
  }

  type Mutation {
    createHello(input: CreateHelloInput!): MutationHelloPayload
  }
`
