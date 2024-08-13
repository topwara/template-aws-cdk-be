// Lib
import * as AWS from 'aws-sdk'

// Include

const dynamoDB = new AWS.DynamoDB.DocumentClient({ region: 'ap-southeast-1' })

export default dynamoDB
