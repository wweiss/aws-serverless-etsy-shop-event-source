import { LoggerFactory } from '@codification/cutwater-logging';
import { Lambda } from 'aws-sdk';
import { InvocationRequest } from 'aws-sdk/clients/lambda';
import { EtsyListing, ListingProcessor } from './';

const Logger = LoggerFactory.getLogger();

export class LambdaListingProcessor implements ListingProcessor {
  private lambdaFunctionName: string;
  private lambda: Lambda = new Lambda();

  constructor(lambdaFunctionName: string) {
    this.lambdaFunctionName = lambdaFunctionName;
  }

  public process(listings: EtsyListing[]): void {
    const params: InvocationRequest = {
      FunctionName: this.lambdaFunctionName,
      InvocationType: 'Event',
      Payload: JSON.stringify(listings),
    };
    this.lambda.invoke(params, err => {
      if (err) {
        Logger.error(`Encountered error publishing listings to lambda[${this.lambdaFunctionName}]: `, err);
      } else {
        Logger.info(`Successfully published ${listings.length} listing(s) to lambda: ${this.lambdaFunctionName}`);
      }
    });
  }
}
