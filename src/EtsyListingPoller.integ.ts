import { LoggerFactory } from '@codification/cutwater-logging';
import { EtsyListing, ListingProcessor, PollingCheckpoint } from '.';
import { AppConfig } from './AppConfig';
import { EstyListingPoller } from './EtsyListingPoller';

const Logger = LoggerFactory.getLogger();

// tslint:disable: max-classes-per-file
class MockPollingCheckpoint implements PollingCheckpoint {
  public lastHash = '';

  constructor(lastHash?: string) {
    if (lastHash) {
      this.lastHash = lastHash;
    }
  }

  public getLastHash(): Promise<string> {
    return Promise.resolve(this.lastHash);
  }

  public updateHash(currentHash: string): void {
    this.lastHash = currentHash;
  }
}

class MockListingProcessor implements ListingProcessor {
  public process(listings: EtsyListing[]): void {
    Logger.info('Recieved listings: ' + JSON.stringify(listings));
  }
}

describe('EtsyListingPoller', () => {
  const checkpoint = new MockPollingCheckpoint();
  const processor = new MockListingProcessor();
  const poller = new EstyListingPoller(new AppConfig(), checkpoint, processor);

  it('can properly poll for etsy listings', async () => {
    let listings: EtsyListing[] = await poller.doPoll();
    Logger.trace('Listings: ' + JSON.stringify(listings));
    Logger.debug('Checkpoint Hash: ' + checkpoint.lastHash);

    expect(listings.length).toBeGreaterThan(0);
    expect(listings[0].images.length).toBeGreaterThan(0);
    expect(checkpoint.lastHash.length).toBeGreaterThan(0);

    const lastHash = checkpoint.lastHash;
    listings = await poller.doPoll();
    expect(listings.length).toEqual(0);
    expect(checkpoint.lastHash).toEqual(lastHash);
  });
});
