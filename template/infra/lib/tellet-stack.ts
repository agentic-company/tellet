import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigatewayv2";
import * as apiIntegrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";

interface TelletStackProps extends cdk.StackProps {
  projectName: string;
}

export class TelletStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TelletStackProps) {
    super(scope, id, props);

    const { projectName } = props;

    // ==========================================
    // VPC — Minimal, no NAT Gateway ($0)
    // ==========================================
    const vpc = new ec2.Vpc(this, "Vpc", {
      maxAzs: 2,
      natGateways: 0, // Save ~$30/mo
      subnetConfiguration: [
        {
          name: "public",
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          name: "isolated",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // ==========================================
    // Secrets Manager — API keys
    // ==========================================
    const secrets = new secretsmanager.Secret(this, "Secrets", {
      secretName: `${projectName}/api-keys`,
      description: "tellet API keys",
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          ANTHROPIC_API_KEY: "REPLACE_ME",
          OPENAI_API_KEY: "",
        }),
        generateStringKey: "placeholder",
      },
    });

    // ==========================================
    // RDS PostgreSQL — Free Tier (~$0)
    // ==========================================
    const dbSecurityGroup = new ec2.SecurityGroup(this, "DbSg", {
      vpc,
      description: "RDS security group",
    });

    const database = new rds.DatabaseInstance(this, "Database", {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_17,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T4G,
        ec2.InstanceSize.MICRO // Free Tier
      ),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [dbSecurityGroup],
      databaseName: "tellet",
      credentials: rds.Credentials.fromGeneratedSecret("tellet", {
        secretName: `${projectName}/db-credentials`,
      }),
      allocatedStorage: 20, // Free Tier max
      maxAllocatedStorage: 20,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: false, // Set true for production
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change for production
    });

    // ==========================================
    // Lambda — Next.js App (~$0 with free tier)
    // ==========================================
    const appFunction = new lambda.DockerImageFunction(this, "AppFunction", {
      code: lambda.DockerImageCode.fromImageAsset(".."), // Parent dir (project root)
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: {
        NODE_ENV: "production",
        DATABASE_URL: `postgresql://tellet:${database.secret?.secretValueFromJson("password").unsafeUnwrap()}@${database.dbInstanceEndpointAddress}:${database.dbInstanceEndpointPort}/tellet`,
        SECRETS_ARN: secrets.secretArn,
      },
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      architecture: lambda.Architecture.ARM_64, // 20% cheaper
    });

    // Grant Lambda access to secrets and DB
    secrets.grantRead(appFunction);
    database.connections.allowDefaultPortFrom(appFunction);

    // ==========================================
    // Agent Worker Lambda — Long tasks (15min)
    // ==========================================
    const workerFunction = new lambda.DockerImageFunction(this, "WorkerFunction", {
      code: lambda.DockerImageCode.fromImageAsset(".."),
      memorySize: 1024,
      timeout: cdk.Duration.minutes(15), // Max Lambda timeout
      environment: {
        NODE_ENV: "production",
        DATABASE_URL: `postgresql://tellet:${database.secret?.secretValueFromJson("password").unsafeUnwrap()}@${database.dbInstanceEndpointAddress}:${database.dbInstanceEndpointPort}/tellet`,
        SECRETS_ARN: secrets.secretArn,
        WORKER_MODE: "true",
      },
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      architecture: lambda.Architecture.ARM_64,
    });

    secrets.grantRead(workerFunction);
    database.connections.allowDefaultPortFrom(workerFunction);

    // ==========================================
    // API Gateway — HTTP API
    // ==========================================
    const httpApi = new apigateway.HttpApi(this, "HttpApi", {
      apiName: `${projectName}-api`,
      corsPreflight: {
        allowOrigins: ["*"],
        allowMethods: [apigateway.CorsHttpMethod.ANY],
        allowHeaders: ["*"],
      },
    });

    const appIntegration = new apiIntegrations.HttpLambdaIntegration(
      "AppIntegration",
      appFunction
    );

    httpApi.addRoutes({
      path: "/{proxy+}",
      methods: [apigateway.HttpMethod.ANY],
      integration: appIntegration,
    });

    httpApi.addRoutes({
      path: "/",
      methods: [apigateway.HttpMethod.ANY],
      integration: appIntegration,
    });

    // ==========================================
    // S3 — Static assets
    // ==========================================
    const staticBucket = new s3.Bucket(this, "StaticBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // ==========================================
    // CloudFront — CDN
    // ==========================================
    const distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: new origins.HttpOrigin(
          `${httpApi.httpApiId}.execute-api.${this.region}.amazonaws.com`
        ),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
      },
      additionalBehaviors: {
        "/_next/static/*": {
          origin: origins.S3BucketOrigin.withOriginAccessControl(staticBucket),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
      },
    });

    // ==========================================
    // Outputs
    // ==========================================
    new cdk.CfnOutput(this, "SiteUrl", {
      value: `https://${distribution.distributionDomainName}`,
      description: "Your AI company URL",
    });

    new cdk.CfnOutput(this, "ApiUrl", {
      value: httpApi.url || "",
      description: "API Gateway URL",
    });

    new cdk.CfnOutput(this, "DatabaseEndpoint", {
      value: database.dbInstanceEndpointAddress,
      description: "RDS endpoint",
    });

    new cdk.CfnOutput(this, "SecretsArn", {
      value: secrets.secretArn,
      description: "Secrets Manager ARN — update with your API keys",
    });

    new cdk.CfnOutput(this, "EstimatedMonthlyCost", {
      value: "$5-15 (Lambda free tier + RDS free tier + CloudFront free tier)",
      description: "Estimated monthly cost",
    });
  }
}
