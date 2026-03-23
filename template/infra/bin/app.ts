#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { TelletStack } from "../lib/tellet-stack";

const app = new cdk.App();

const projectName = app.node.tryGetContext("projectName") || "tellet";

new TelletStack(app, `${projectName}-stack`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || "us-east-1",
  },
  projectName,
});
