import {Observer} from 'rxjs/Observer';
import {Observable} from 'rxjs/Observable';

import * as got from 'got';
import {RateLimiter} from 'limiter';

import {AppConfig} from './AppConfig';

export class PollingHandler {
  private readonly URL_BASE = 'https://openapi.etsy.com/v2';

  private config : AppConfig;
  private limiter : RateLimiter;

  constructor() {
    this.config = new AppConfig();
    this.limiter = new RateLimiter(this.config.requestsPerSecond, 'second');
  }

  public poll() : void {
    this.getActiveListings();
  }

  private getActiveListings() : Observable < any[] > {
    return Observable.create((observer : Observer < any[] >) => {
      this
        .limiter
        .removeTokens(1, () => got(`${this.URL_BASE}/shops/${this.config.shopId}/listings/active?api_key=${this.config.apiKey}`, {json: true}).then(resp => {
          observer.next(resp.body.results);
          observer.complete();
        }))
    });
  }

  private getImages(listingId : string) : Observable < any[] > {
    return Observable.create((observer : Observer < any[] >) => {
      this
        .limiter
        .removeTokens(1, () => got(`${this.URL_BASE}/listings/${listingId}/images?api_key=${this.config.apiKey}`, {json: true}).then(resp => {
          observer.next(resp.body.results);
          observer.complete();
        }))
    });
  }
}
