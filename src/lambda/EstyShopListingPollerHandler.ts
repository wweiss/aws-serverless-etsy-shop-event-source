import * as AWS from 'aws-sdk';
import { Context, Callback, ScheduledEvent } from 'aws-lambda';

import { PollingHandler } from '../PollingHandler';

const poller: PollingHandler = new PollingHandler(null);

exports.handler = (event: ScheduledEvent, context: Context) => {
  poller.poll();
};
