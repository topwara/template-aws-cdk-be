#!/usr/bin/env node

// Lib
import * as cdk from 'aws-cdk-lib'
import 'source-map-support/register'

// Include
import { CdkStack } from '../lib/cdk-stack'
import { APP_NAME } from '../src/config/index'

// Setup
const app = new cdk.App()
new CdkStack(app, APP_NAME)
