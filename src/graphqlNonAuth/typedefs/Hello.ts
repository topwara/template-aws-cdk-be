import gql from 'graphql-tag'

export default gql`
  # #######################  T Y P E  #######################

  type MutationHello {
    res_code: String!
    res_desc: String!

    msg: String!
  }

  type Hello {
    res_code: String!
    res_desc: String!

    msg: String!
  }

  union MutationHelloPayload = MutationHello | Error
  union HelloPayload = Hello | Error

  # ####################### I N P U T #######################

  input CreateHelloInput {
    msg: String!
  }

  # ###################### F I L T E R ######################

  # ######################   S O R T   ######################
`
