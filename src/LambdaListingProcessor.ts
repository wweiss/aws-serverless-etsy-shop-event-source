import { EtsyListing, ListingProcessor } from '.';

export class LambdaListingProcessor implements ListingProcessor {
  private lambdaFunctionName: string;

  constructor(lambdaFunctionName: string) {
    this.lambdaFunctionName = lambdaFunctionName;
  }

  process(listings: EtsyListing[]): void {
    throw new Error('Method not implemented.');
  }
}
