import { Lambda } from 'aws-sdk';
import { InvocationRequest } from 'aws-sdk/clients/lambda';

import { EtsyListing, ListingProcessor } from './';
import { Logger } from './Logger';

export class LambdaListingProcessor implements ListingProcessor {
  private lambdaFunctionName : string;
  private lambda : Lambda = new Lambda();

  constructor(lambdaFunctionName : string) {
    this.lambdaFunctionName = lambdaFunctionName;
  }

  process(listings : EtsyListing[]) : void {
    const params: InvocationRequest = {
      FunctionName: this.lambdaFunctionName,
      InvocationType: 'Event',
      Payload: JSON.stringify(listings)
    }
    this
      .lambda
      .invoke(params, (err, data) => {
        if (err) {
          Logger.error(`Encountered error publishing listings to lambda[${this.lambdaFunctionName}]: `, err);
        } else {
          Logger.debug(`Successfully published listings to lambda[${this.lambdaFunctionName}]: `, data);
        }
      })
  }
}
