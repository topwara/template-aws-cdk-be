// Lib
import * as jwt from 'jsonwebtoken'
import { GraphQLError } from 'graphql'
import { APIGatewayProxyEvent } from 'aws-lambda'

// Include
import { TTokenPayload } from '../utils/type'
import { ACCESS_TOKEN_SECRET } from '../config'

// => middleware
const lambdaHandler = (event: APIGatewayProxyEvent): TTokenPayload => {
  console.log('---------- START | middleware ----------')

  try {
    // [STEP 1] : Get Important items from event
    const token = event.headers.Authorization as string

    // [STEP 2] : Seperate Token between (Bearer___*seperate here*___eyASDASFSFASDdasdas)
    const accessToken = token.substr('Bearer '.length).trim()

    // [STEP 3] : User jwt.verify to Read What inside AccessToken
    const tokenPayload = jwt.verify(accessToken, ACCESS_TOKEN_SECRET) as TTokenPayload

    // [STEP 4] : Re-Check typeTokenAuth
    if (tokenPayload.typeTokenAuth !== 'access') throw new GraphQLError('Sorry, typeTokenAuth is not (access)')

    // [STEP 5] : Format Items
    const context: TTokenPayload = {
      userID: tokenPayload.userID,
      typeTokenAuth: 'access',
    }

    // [STEP 6] : This log when everything Success
    console.log('| ✔ AccessToken verified')
    console.log('----------  END  | middleware | Success ----------')
    return context
  } catch (error) {
    console.log('| ✖ AccessToken not verified')
    console.log('----------  END  | middleware | Error   ----------', error)
    throw new GraphQLError(error as string)
  }
}

export default lambdaHandler
