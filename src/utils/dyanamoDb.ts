/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
//@ts-nocheck

import { encode, decode } from 'js-base64'
import { IValueFilterExpression, ICondition, UpdateSubParams, TValueBetween } from './type'
import { PromiseResult } from 'aws-sdk/lib/request'
import { AWSError } from 'aws-sdk'

// <----------- START Original DynamoDB CRUD ----------->
export const dynamodbQuery = async (
  db: AWS.DynamoDB.DocumentClient,
  params: AWS.DynamoDB.DocumentClient.QueryInput,
): Promise<AWS.DynamoDB.DocumentClient.QueryOutput> => {
  const results = await db.query(params).promise()
  return results
}

export const dynamodbScan = async (
  db: AWS.DynamoDB.DocumentClient,
  params: AWS.DynamoDB.DocumentClient.QueryInput,
): Promise<AWS.DynamoDB.DocumentClient.QueryOutput> => {
  const results = await db.scan(params).promise()
  return results
}

// Function: DynamoDB -> Delete
export const dynamodbDelete = async (
  db: AWS.DynamoDB.DocumentClient,
  deleteParams: AWS.DynamoDB.DocumentClient.DeleteItemInput,
): Promise<AWS.DynamoDB.DocumentClient.DeleteItemOutput> => {
  const dbResponse = await db.delete(deleteParams).promise()
  return dbResponse
}

// Function: DynamoDB -> Update
export const dynamodbUpdate = async (
  db: AWS.DynamoDB.DocumentClient,
  updateParams: AWS.DynamoDB.DocumentClient.UpdateItemInput,
): Promise<AWS.DynamoDB.DocumentClient.UpdateItemOutput> => {
  const results = await db.update(updateParams).promise()
  return results
}

// Function: DynamoDB -> Put (Insert)
export const dynamodbPut = async (
  db: AWS.DynamoDB.DocumentClient,
  putParams: AWS.DynamoDB.DocumentClient.Put,
): Promise<AWS.DynamoDB.DocumentClient.PutItemOutput> => {
  const results = await db.put(putParams).promise()
  return results
}

// <----------- END Original DynamoDB CRUD ----------->

// <----------- START Modify DynamoDB CRUD ----------->
// Map & Format syntax for BatchGetItemInput - Keys  understand
// const keyID = tagsList.map((_ele: string) => ({ companyID: userToken.companyID, tagID: _ele }))

// Function: DynamoDB -> Batch Get get by (KeyTable) with multiple query
export const dynamodbBatchGetItems = async (
  db: AWS.DynamoDB.DocumentClient,
  TableName: string,
  pkName: string | null,
  pkVal: any | null,
  skName: string,
  skValIDs: string[],
) => {
  // Map & Format syntax for BatchGetItemInput - Keys  understand
  const keyID = skValIDs.map((_ele: string) => {
    if (pkName && pkVal) return { [pkName]: pkVal, [skName]: _ele }
    else return { [skName]: _ele }
  })

  // Batch Get Items with Key of Table, TagTable ~ PK:companyID & SK:tagID
  const batchTagIDs: AWS.DynamoDB.DocumentClient.BatchGetItemInput = { RequestItems: { [TableName]: { Keys: keyID } } }

  // Response
  const batchResList = (await db.batchGet(batchTagIDs).promise()).Responses[TableName]

  // Return
  return batchResList
}

// Get using dynamoDb.dynamodbQuery().Items[0] for a single item
export async function getSingleItem<Type>(
  db: AWS.DynamoDB.DocumentClient,
  TableName: string,
  IndexName: string | null = null,
  partitionKeyName: string,
  partitionKeyValue: string | number,
  sortKeyName: string | null = null,
  sortKeyValue: string | number | null = null,
): Promise<Type> {
  let KeyConditionExpression = `#pk = :${partitionKeyName}`
  const ExpressionAttributeValues = {
    [`:${partitionKeyName}`]: partitionKeyValue,
  }
  const ExpressionAttributeNames = {
    '#pk': partitionKeyName,
  }
  if (sortKeyName) {
    KeyConditionExpression += ` AND #sk = :${sortKeyName}`
    ExpressionAttributeValues[`:${sortKeyName}`] = sortKeyValue
    ExpressionAttributeNames['#sk'] = sortKeyName
  }
  const params: AWS.DynamoDB.DocumentClient.QueryInput = {
    TableName,
    IndexName,
    KeyConditionExpression,
    ExpressionAttributeValues,
    ExpressionAttributeNames,
  }

  if (!IndexName) delete params.IndexName

  const item = (await dynamodbQuery(db, params)).Items[0]
  return item as Type
}

function packFilterExpression(
  filterExpression: Record<string, IValueFilterExpression> | null = null,
  params: AWS.DynamoDB.DocumentClient.ScanInput,
): AWS.DynamoDB.DocumentClient.ScanInput {
  let i = 0
  let tempFilterExpression: string
  if (typeof filterExpression === 'object') {
    for (const key in filterExpression) {
      const filterKey = key
      const filterCon = filterExpression[filterKey].condition
      const filterVal = filterExpression[filterKey].value

      if (filterKey) {
        i++
        if (filterCon === 'BETWEEN') {
          const valueBetween = filterVal as TValueBetween
          if (valueBetween.a && valueBetween.b) {
            if (i === 1) tempFilterExpression = `#${filterKey} ${filterCon} :${filterKey}_a AND :${filterKey}_b`
            if (i > 1)
              tempFilterExpression =
                tempFilterExpression + ` AND #${filterKey} ${filterCon} :${filterKey}_a AND :${filterKey}_b`

            params.ExpressionAttributeNames[`#${filterKey}`] = `${filterKey}`
            params.ExpressionAttributeValues[`:${filterKey}_a`] = valueBetween.a
            params.ExpressionAttributeValues[`:${filterKey}_b`] = valueBetween.b
          }
        } else if (filterCon === 'IN') {
          const valueIn = filterVal as string[] | number[]
          if (valueIn.length > 0) {
            if (i === 1)
              tempFilterExpression = `#${filterKey} ${filterCon} ( ${valueIn
                .map((_, i: number) => `:${filterKey}_${i}`)
                .join(', ')} )`
            if (i > 1)
              tempFilterExpression =
                tempFilterExpression +
                ` AND #${filterKey} ${filterCon} ( ${valueIn.map((_, i: number) => `:${filterKey}_${i}`).join(', ')} )`

            params.ExpressionAttributeNames[`#${filterKey}`] = `${filterKey}`
            valueIn.map((value: string | number, i: number) => {
              params.ExpressionAttributeValues[`:${filterKey}_${i}`] = value
            })
          }
        } else if (filterCon === 'attribute_not_exists') {
          if (i === 1) tempFilterExpression = `attribute_not_exists(#${filterKey})`
          if (i > 1) tempFilterExpression = tempFilterExpression + ` AND attribute_not_exists(#${filterKey})`

          params.ExpressionAttributeNames[`#${filterKey}`] = `${filterKey}`
        } else {
          if (filterCon === 'begins_with' || filterCon === 'contains') {
            if (filterVal) {
              if (i === 1) tempFilterExpression = `${filterCon}(#${filterKey}, :${filterKey})`
              if (i > 1) tempFilterExpression = tempFilterExpression + ` AND ${filterCon}(#${filterKey}, :${filterKey})`

              params.ExpressionAttributeNames[`#${filterKey}`] = `${filterKey}`
              params.ExpressionAttributeValues[`:${filterKey}`] = filterVal
            }
          } else {
            if (i === 1) tempFilterExpression = `#${filterKey} ${filterCon} :${filterKey}`
            if (i > 1) tempFilterExpression = tempFilterExpression + ` AND #${filterKey} ${filterCon} :${filterKey}`

            params.ExpressionAttributeNames[`#${filterKey}`] = `${filterKey}`
            params.ExpressionAttributeValues[`:${filterKey}`] = filterVal
          }
        }
      }
    }

    params['FilterExpression'] = tempFilterExpression
  }

  return params
}

function packSortKeyExpression(
  sortKeyName: string | null = null,
  sortKeyValue: string | number | TValueBetween | string[] | number[] | null = null,
  sortKeyCondition: ICondition | null = null,
  params: AWS.DynamoDB.DocumentClient.QueryInput,
  partitionKeyName: string,
): AWS.DynamoDB.DocumentClient.QueryInput {
  if (sortKeyName) {
    if (sortKeyCondition === 'BETWEEN') {
      const valueBetween = sortKeyValue as TValueBetween
      if (valueBetween.a && valueBetween.b) {
        params.KeyConditionExpression = `#${partitionKeyName} = :${partitionKeyName} AND #${sortKeyName} ${sortKeyCondition} :${sortKeyName}_a AND :${sortKeyName}_b`

        params.ExpressionAttributeNames[`#${sortKeyName}`] = `${sortKeyName}`
        params.ExpressionAttributeValues[`:${sortKeyName}_a`] = valueBetween.a
        params.ExpressionAttributeValues[`:${sortKeyName}_b`] = valueBetween.b
      }
    } else if (sortKeyCondition === 'IN') {
      const valueIn = sortKeyValue as string[] | number[]
      if (valueIn.length > 0) {
        params.KeyConditionExpression = `#${partitionKeyName} = :${partitionKeyName} AND #${sortKeyName} ${sortKeyCondition} ( ${valueIn
          .map((_, i: number) => `:${sortKeyName}_${i}`)
          .join(', ')} )`

        params.ExpressionAttributeNames[`#${sortKeyName}`] = `${sortKeyName}`
        valueIn.map((value: string | number, i: number) => {
          params.ExpressionAttributeValues[`:${sortKeyName}_${i}`] = value
        })
      }
    } else if (sortKeyCondition === 'attribute_not_exists') {
      params.KeyConditionExpression = `#${partitionKeyName} = :${partitionKeyName} AND attribute_not_exists(#${sortKeyName})`
      params.ExpressionAttributeNames[`#${sortKeyName}`] = `${sortKeyName}`
    } else {
      if (sortKeyCondition === 'begins_with' || sortKeyCondition === 'contains') {
        if (sortKeyValue) {
          params.KeyConditionExpression = `#${partitionKeyName} = :${partitionKeyName} AND ${sortKeyCondition}(#${sortKeyName}, :${sortKeyName})`
          params.ExpressionAttributeNames[`#${sortKeyName}`] = `${sortKeyName}`
          params.ExpressionAttributeValues[`:${sortKeyName}`] = sortKeyValue
        }
      } else {
        params.KeyConditionExpression = `#${partitionKeyName} = :${partitionKeyName} AND #${sortKeyName} ${sortKeyCondition} :${sortKeyName}`
        params.ExpressionAttributeNames[`#${sortKeyName}`] = `${sortKeyName}`
        params.ExpressionAttributeValues[`:${sortKeyName}`] = sortKeyValue
      }
    }
  }

  return params
}

// Function: dynamoDb -> Get using dynamoDb.dynamodbQuery() for a Multiple item
export async function getMultipleItems<Type>(
  dynamoDb: AWS.DynamoDB.DocumentClient,
  TableName: string,
  IndexName: string | null = null,
  nextToken: string,
  pageSize: number,
  partitionKeyName: string,
  partitionKeyValue: string | number,
  sortKeyName: string | null = null,
  sortKeyValue: string | number | TValueBetween | string[] | number[] | null = null,
  sortKeyCondition: ICondition | null = null, // Case BETWEEN not Cover in this function
  filterExpression: Record<string, IValueFilterExpression> | null = null,
  scanIndexForward: boolean | null = true,
): Promise<{ items: Type; newNextToken: string }> {
  const dataList: AWS.DynamoDB.DocumentClient.ItemList = []

  let ExclusiveStartKey = null
  if (nextToken) {
    ExclusiveStartKey = decode(nextToken)
    ExclusiveStartKey = JSON.parse(ExclusiveStartKey)
  }

  const params: AWS.DynamoDB.DocumentClient.QueryInput = {
    TableName,
    IndexName,
    Limit: pageSize,
    KeyConditionExpression: `#${partitionKeyName} = :${partitionKeyName}`,
    ExpressionAttributeNames: {
      [`#${partitionKeyName}`]: `${partitionKeyName}`,
    },
    ExpressionAttributeValues: {
      [`:${partitionKeyName}`]: partitionKeyValue,
    },
    ExclusiveStartKey: ExclusiveStartKey,
    ScanIndexForward: scanIndexForward,
  }

  const newParamsAfterPackSortKeyExpression = packSortKeyExpression(
    sortKeyName,
    sortKeyValue,
    sortKeyCondition,
    params,
    partitionKeyName,
  )

  const newParamsAfterPackFilterExpression = packFilterExpression(filterExpression, newParamsAfterPackSortKeyExpression)

  if (!IndexName) delete newParamsAfterPackFilterExpression.IndexName

  let res = await dynamodbQuery(dynamoDb, newParamsAfterPackFilterExpression)
  dataList.push(...res.Items)

  while (dataList.length < pageSize && Object.prototype.hasOwnProperty.call(res, 'LastEvaluatedKey')) {
    const newParams = {
      ...newParamsAfterPackFilterExpression,
      Limit: pageSize - dataList.length,
      ExclusiveStartKey: res.LastEvaluatedKey,
    }

    res = await dynamodbQuery(dynamoDb, newParams)
    dataList.push(...res.Items)
  }

  // => [Encode] nextToken
  let _nextToken = null
  if (res?.LastEvaluatedKey) {
    _nextToken = encode(JSON.stringify(res.LastEvaluatedKey))
  }

  return { items: dataList as Type, newNextToken: _nextToken }
}

// Function: dynamoDb -> Get using dynamoDb.dynamodbScan() for a Multiple item
export async function scanMultipleItems<Type>(
  dynamoDb: AWS.DynamoDB.DocumentClient,
  TableName: string,
  nextToken: string,
  pageSize: number,
  filterExpression: Record<string, IValueFilterExpression> | null = null,
): Promise<{ items: Type; newNextToken: string }> {
  const dataList: AWS.DynamoDB.DocumentClient.ItemList = []

  let ExclusiveStartKey = null
  if (nextToken) {
    ExclusiveStartKey = decode(nextToken)
    ExclusiveStartKey = JSON.parse(ExclusiveStartKey)
  }

  const params: AWS.DynamoDB.DocumentClient.ScanInput = {
    TableName,
    Limit: pageSize,
    ExpressionAttributeNames: {},
    ExpressionAttributeValues: {},
    ExclusiveStartKey: ExclusiveStartKey,
  }

  const newParamsAfterPackFilterExpression = packFilterExpression(filterExpression, params)

  if (
    Object.keys(newParamsAfterPackFilterExpression.ExpressionAttributeNames).length === 0 &&
    Object.keys(newParamsAfterPackFilterExpression.ExpressionAttributeValues).length === 0
  ) {
    delete newParamsAfterPackFilterExpression.ExpressionAttributeNames
    delete newParamsAfterPackFilterExpression.ExpressionAttributeValues
  }

  let res = await dynamodbScan(dynamoDb, newParamsAfterPackFilterExpression)
  dataList.push(...res.Items)

  while (dataList.length < pageSize && Object.prototype.hasOwnProperty.call(res, 'LastEvaluatedKey')) {
    const newParams = {
      ...newParamsAfterPackFilterExpression,
      Limit: pageSize - dataList.length,
      ExclusiveStartKey: res.LastEvaluatedKey,
    }

    res = await dynamodbScan(dynamoDb, newParams)
    dataList.push(...res.Items)
  }

  // => [Encode] nextToken
  let _nextToken = null
  if (res?.LastEvaluatedKey) {
    _nextToken = encode(JSON.stringify(res.LastEvaluatedKey))
  }

  return { items: dataList as Type, newNextToken: _nextToken }
}

// https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.html
// A Query operation can retrieve a maximum of 1 MB of data. This limit applies before the filter expression is evaluated.
// The only way to know when you have reached the end of the result set is when LastEvaluatedKey is empty.
// EDIT: Replaced hasOwnProperty to Object.prototype.hasOwnProperty.call
// https://stackoverflow.com/questions/39282873/how-do-i-access-the-object-prototype-method-in-the-following-logic
export async function queryUntilDone<Type>(
  dynamoDb: AWS.DynamoDB.DocumentClient,
  TableName: string,
  IndexName: string | null = null,
  partitionKeyName: string,
  partitionKeyValue: string | number,
  sortKeyName: string | null = null,
  sortKeyValue: string | number | TValueBetween | string[] | number[] | null = null,
  sortKeyCondition: ICondition | null = null, // Case BETWEEN not Cover in this function
  filterExpression: Record<string, IValueFilterExpression> | null = null,
  scanIndexForward: boolean | null = true,
): Promise<Type> {
  const dataList: AWS.DynamoDB.DocumentClient.ItemList = []

  const params: AWS.DynamoDB.DocumentClient.QueryInput = {
    TableName,
    IndexName,
    KeyConditionExpression: `#${partitionKeyName} = :${partitionKeyName}`,
    ExpressionAttributeNames: {
      [`#${partitionKeyName}`]: `${partitionKeyName}`,
    },
    ExpressionAttributeValues: {
      [`:${partitionKeyName}`]: partitionKeyValue,
    },
    ScanIndexForward: scanIndexForward,
  }

  const newParamsAfterPackSortKeyExpression = packSortKeyExpression(
    sortKeyName,
    sortKeyValue,
    sortKeyCondition,
    params,
    partitionKeyName,
  )

  const newParamsAfterPackFilterExpression = packFilterExpression(filterExpression, newParamsAfterPackSortKeyExpression)

  if (!IndexName) delete newParamsAfterPackFilterExpression.IndexName

  let data = await dynamoDb.query(newParamsAfterPackFilterExpression).promise()
  dataList.push(...data.Items)
  while (Object.prototype.hasOwnProperty.call(data, 'LastEvaluatedKey')) {
    const newParams = {
      ...newParamsAfterPackFilterExpression,
      ExclusiveStartKey: data.LastEvaluatedKey,
    }
    data = await dynamoDb.query(newParams).promise()
    dataList.push(...data.Items)
  }
  return dataList as Type
}

// Get using dynamoDb.deleteItem() for a single item
export async function deleteSingleItem(
  dynamoDb: AWS.DynamoDB.DocumentClient,
  TableName: string,
  partitionKeyName: string,
  partitionKeyValue: string | number,
  sortKeyName: string | null = null,
  sortKeyValue: string | number | null = null,
): Promise<AWS.DynamoDB.DocumentClient.DeleteItemOutput> {
  const Key = {
    [partitionKeyName]: partitionKeyValue,
  }
  if (sortKeyName && sortKeyValue) Key[sortKeyName] = sortKeyValue
  const paramsGet: AWS.DynamoDB.DocumentClient.DeleteItemInput = {
    TableName,
    Key,
  }
  return await dynamoDb.delete(paramsGet).promise()
}

// Put using dynamoDb.transactWrite() for a Multiple item divides each batch into 50 items with each call.
// FYI: a transaction cannot contain more than 100 unique items.
export async function transactWrite(
  dynamoDb: AWS.DynamoDB.DocumentClient,
  params: AWS.DynamoDB.DocumentClient.TransactWriteItemsInput,
) {
  const chunkSize = 50
  const transactWritePromise: Promise<PromiseResult<AWS.DynamoDB.DocumentClient.TransactWriteItemsOutput, AWSError>>[] =
    []

  for (let i = 0; i < params.TransactItems.length; i += chunkSize) {
    const chunk = params.TransactItems.slice(i, i + chunkSize)
    transactWritePromise.push(
      dynamoDb
        .transactWrite({
          TransactItems: chunk,
        })
        .promise(),
    )
  }
  await Promise.all(transactWritePromise)
}

// <----------- END Modify DynamoDB CRUD ----------->

// Function: MapperObject -> For update many Attributes in Item with / DocumentClient.UpdateItemInput /
export const dynamoDBUpdateFromAttributes = (input: any, ignoreKeyList: string[] = []): UpdateSubParams => {
  // Ex. Pack data
  // UpdateExpression SET #bankCompany = :bankCompany, #shopFriend = :shopFriend,
  // ExpressionAttributeValues {
  //   ':bankCompany': 'CIMB_THAI',
  //   ':shopFriend': [ { userID: 'donut2' } ]
  // }
  // UpdateExpression slice SET #bankCompany = :bankCompany, #shopFriend = :shopFriend

  let UpdateExpression = 'SET'
  const ExpressionAttributeValues: any = {}
  const ExpressionAttributeNames: any = {}

  for (const [key, value] of Object.entries(input)) {
    if (ignoreKeyList.includes(key)) continue
    UpdateExpression += ` #${key} = :${key},`
    ExpressionAttributeNames[`#${key}`] = key
    ExpressionAttributeValues[`:${key}`] = value
  }
  UpdateExpression = UpdateExpression.substr(0, UpdateExpression.length - 1)

  return {
    UpdateExpression,
    ExpressionAttributeValues,
    ExpressionAttributeNames,
  }
}
