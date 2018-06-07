import * as dotenv from 'dotenv';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import * as test from 'tape';

import { EtsyListing, ListingProcessor, PollingCheckpoint } from './';
import { AppConfig } from './AppConfig';
import { EstyListingPoller } from './EtsyListingPoller';

dotenv.config();

test('EtsyListingPoller Unit Tests', t => {
  t.plan(4);

  const checkpoint = new MockPollingCheckpoint();
  const processor = new MockListingProcessor();
  const poller = new EstyListingPoller(new AppConfig(), checkpoint, processor);

  poller.doPoll().subscribe(listings => {
    console.log('Listings: ', listings);
    console.log('Checkpoint Hash: ', checkpoint.lastHash);
    t.ok(listings && listings.length > 0, 'can get active listings');
    t.ok(listings[0].images.length > 0, 'can fetch image urls');
    t.ok(checkpoint.lastHash.length > 0, 'properly sets the checkpoint hash');

    const lastHash = checkpoint.lastHash;
    poller
      .doPoll()
      .subscribe(
        listings => t.fail('no listings should return without changes'),
        null,
        () => {
          t.equal(
            checkpoint.lastHash,
            lastHash,
            'hash does not change when no changes are detected'
          );
        }
      );
  });
});

class MockPollingCheckpoint implements PollingCheckpoint {
  lastHash = '';

  constructor(lastHash?: string) {
    if (lastHash) {
      this.lastHash = lastHash;
    }
  }

  getLastHash(): Observable<string> {
    return of(this.lastHash);
  }

  updateHash(currentHash: string): void {
    this.lastHash = currentHash;
  }
}

class MockListingProcessor implements ListingProcessor {
  process(listings: EtsyListing[]): void {
    console.log('Recieved listings: ', listings);
  }
}
