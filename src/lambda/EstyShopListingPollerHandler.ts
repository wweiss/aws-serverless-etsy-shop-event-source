import { AppConfig } from '../AppConfig';
import { DynamoDBPollingCheckpoint } from '../DynamoDBPollingCheckpoint';
import { EstyListingPoller } from '../EtsyListingPoller';
import { LambdaListingProcessor } from '../LambdaListingProcessor';

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

exports.handler = () => {
  poller.poll();
};
