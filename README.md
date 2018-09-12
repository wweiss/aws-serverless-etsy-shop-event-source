# AWS Serverless Etsy Shop Event Source

This serverless app creates an AWS Lambda event source by invoking a given lambda function to monitor active listings in a specified Etsy Shop. It works by periodically polling the freely available public Etsy API and invoking a lambda function you provide to process active listings.

## Architecture

1.  The **EtsyListingPoller** lambda function is periodically triggered by a CloudWatch Events Rule.

2.  A DynamoDB table is used to keep track of a checkpoint, which is a hash of the most recent results.

3.  The poller function calls the public Etsy API and fetches all active listing for the specified **ShopId** (provided by the app user).

4.  The **ListingProcessor** lambda function (provided by the app user) is invoked with all active listing if there have been any changes based on the hash.

    i. Note, the **ListingProcessor** function is invoked asynchronously (Event invocation type). The app does not confirm that the lambda was able to successfully process the listings.

## Installation Steps

1.  [Create an AWS account](https://portal.aws.amazon.com/gp/aws/developer/registration/index.html) if you do not already have one and login

2.  Go to the app's page on the [Serverless Application Repository](https://serverlessrepo.aws.amazon.com/applications/arn:aws:serverlessrepo:us-east-1:771389557967:applications~EtsyShopEventSource) and click "Deploy"

3.  Provide the required app parameters (see below for steps to create Etsy API parameters, e.g., API Key)

## Etsy API Key Parameters

The app requires an Etsy developer API Key. The following steps walk you through registering the app with your Etsy Developer account to create these values.

1.  Create an [Etsy](https://www.etsy.com) account if you do not already have one

    i. Note: To create applications you are required to enable two factor authentication.

2.  Register a new application with your Etsy account:

    i.Go to https://www.etsy.com/developers

    ii. Click "Create a New App"

    iii. Fill out required fields and click "Read Terms and Create App"

3.  Get API Key:

    i. After creating your application, click on the "Apps You've Made" link on the right side of the page.

    ii. Click on the "SEE API KEY DETAILS" under the name of your new app.

    iii. Your API Key is listed under "KEYSTRING".

### Encrypting the Etsy API Key

Once you've created your Etsy API key, you can copy it as plain text into the **PlainTextApiKey** parameter of the serverless application. However, it is highly recommended that you do NOT pass this value in as plain text and instead encrypt it using an AWS Key Management Service (KMS) key. Once encrypted, you put the encrypted value into the **EncryptedApiKey** parameter and provide the **DecryptionKeyName** parameter as well. The reason the Plaintext fields are provided at all is so this app can be used in regions that do not support AWS KMS.

The following subsections walk you through how to create a KMS key using the AWS console and encrypt your Etsy API Key using the AWS CLI.

#### Create a new KMS Key

1.  Login to the AWS IAM console.

2.  Click the "Encryption keys" menu item.

3.  (Important) Just below the "Create key" button, there will be a Region selected. Change this to be the same region that you will deploy your app to.

4.  Click "Create key".

5.  Enter an alias, e.g., "etsy-api" and click "Next Step".

6.  Click "Next Step" again to skip the add tags step.

7.  Select a role that is allowed to administer the key, e.g., delete it, and click "Next Step".

8.  Select a role that is allowed to use the key, e.g., encrypt with it, and click "Next Step".

9.  Preview the key policy and then click "Finish".

10. Click on your newly created key and copy its full ARN value.

#### Encrypt Etsy API parameter with the AWS CLI

1.  Install the AWS CLI.

2.  Encrypt your Etsy API Key by running this command: `aws kms encrypt --key-id <key ARN> --plaintext '<Etsy API key>'`

3.  The result JSON will contain a field called `CiphertextBlob`. That string value (without the double-quotes) is what should be provided into the **EncryptedApiKey** parameter of the serverless app.

## Other Parameters

In addition to the Etsy API key parameter, the app also requires the following additional parameters:

1.  **ShopId** (required) - This is the Etsy specific ShopId used to identify the shop who's active listings are to be polled.

2.  **ListingProcessorFunctionName** (required) - This is the name (not ARN) of the lambda function that will process listings gathered by the app.

3.  **DecryptionKeyName** (required if providing encrypted the Etsy API Key) - This is the KMS key name of the key used to encrypt the Etsy API key parameter. Note, this must be just the key name (UUID that comes after key/ in the key ARN), not the full key ARN. It's assumed the key was created in the same account and region as the app deployment.

4.  **PollingFrequencyInMinutes** (optional) - The frequency at which the lambda will poll the Etsy API (in minutes). Default: 5.

5.  **IncludeImages** (optional) - Indicates if image metadata (URLs, not the actual image data) should be fetched and returned with the listings. Please be advised that this will slow down the app as it must request each individually and respect the rate limits of Etsy. Default: true.

6.  **RequestsPerSecond** (optional) - Set the rate at which requests can be sent to the Etsy API. Should not be changed unless you have upgraded from the basic, public access limits for Etsy applications. Default: 5.

7.  **PerRequestTimeout** (optional) - Milliseconds before any given request to the Etsy API will timeout and give up. Default: 1500.

8.  **PollTimeout** (optional) - Maximum time in seconds to spend on a given polling sesssion. Default: 30.

9.  **LoggingLevel** (optional) - The level of logging desired (`error,warn,info,verbose,debug` or `silly`).

# Special Thanks

Special thanks to AWS Labs and their excellent [Twitter Event Source](https://github.com/awslabs/aws-serverless-twitter-event-source) for providing the idea and foundations for this app.

Also thanks to [Chris Weiss](https://github.com/bitblit) for the various pieces of logging code and gulp configuration I lifted off him for this.
