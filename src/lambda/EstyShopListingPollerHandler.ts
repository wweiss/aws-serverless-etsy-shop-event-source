import * as AWS from 'aws-sdk';
import { Context, Callback, ScheduledEvent } from 'aws-lambda';

import { AppConfig } from '../AppConfig';
import { EstyListingPoller } from '../EtsyListingPoller';
import { LambdaListingProcessor } from '../LambdaListingProcessor';
import { DynamoDBPollingCheckpoint } from '../DynamoDBPollingCheckpoint';

const config = new AppConfig();
const checkpoint = new DynamoDBPollingCheckpoint(config.tableName);
const processor = new LambdaListingProcessor(
  config.listingProcessorFunctionName
);

const poller: EstyListingPoller = new EstyListingPoller(
  config,
  checkpoint,
  processor
);

exports.handler = (event: ScheduledEvent, context: Context) => {
  poller.poll();
};
