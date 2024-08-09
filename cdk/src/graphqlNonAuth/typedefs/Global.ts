import gql from 'graphql-tag'

export default gql`
  scalar JSON

  type Error {
    res_code: String!
    res_desc: String!
  }
`
