import { Observer } from 'rxjs/Observer';
import { Observable } from 'rxjs/Observable';

import * as got from 'got';

export class PollingHandler {
  private readonly URL_BASE = 'https://openapi.etsy.com/v2';
  private readonly PATH_LISTINGS = '';

  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('An ApiKey is required.');
    }
    this.apiKey = apiKey;
  }

  public poll(): void {}

  public getActiveListings(shopId: string): Observable<any[]> {
    return Observable.create((observer: Observer<any[]>) => {
      got(
        `${this.URL_BASE}/shops/${shopId}/listings/active?api_key=${
          this.apiKey
        }`,
        { json: true }
      ).then(resp => {
        observer.next(resp.body.results);
        observer.complete();
      });
    });
  }
}
