import { of } from 'rxjs/observable/of';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { EmptyObservable } from 'rxjs/observable/EmptyObservable';
import { map, flatMap } from 'rxjs/operators';
import { Observer, empty } from 'rxjs/Observer';
import { Observable } from 'rxjs/Observable';

import * as got from 'got';
import * as md5 from 'md5';
import { RateLimiter } from 'limiter';

import { AppConfig } from './AppConfig';
import {
  PollingCheckpoint,
  EtsyListing,
  ListingImage,
  ListingProcessor
} from '.';

export class EstyListingPoller {
  private readonly URL_BASE = 'https://openapi.etsy.com/v2';

  private config: AppConfig;
  private limiter: RateLimiter;
  private processor: ListingProcessor;
  private checkpoint: PollingCheckpoint;

  constructor(
    config: AppConfig,
    checkpoint: PollingCheckpoint,
    processor: ListingProcessor
  ) {
    this.config = config;
    this.processor = processor;
    this.checkpoint = checkpoint;
    this.limiter = new RateLimiter(this.config.requestsPerSecond, 'second');
  }

  public poll(): void {
    this.doPoll().subscribe(pollResults => {
      if (pollResults) {
        this.processor.process(pollResults);
      }
    });
  }

  doPoll(): Observable<EtsyListing[]> {
    return forkJoin(
      this.getActiveListings(),
      this.checkpoint.getLastHash()
    ).pipe(
      flatMap(results => {
        let rval: Observable<EtsyListing[]>;
        const sortedListings = this.sortEtsyListings(results[0]);
        const lastHash = results[1];
        const currentHash = this.toListingsHash(sortedListings);

        if (currentHash === lastHash) {
          rval = new EmptyObservable();
        } else {
          this.checkpoint.updateHash(currentHash);
          rval = this.config.includeImages
            ? forkJoin(sortedListings.map(listing => this.getImages(listing)))
            : of(sortedListings);
        }

        return rval;
      })
    );
  }

  private getActiveListings(): Observable<EtsyListing[]> {
    return this.callAPI(`/shops/${this.config.shopId}/listings/active`).pipe(
      map((result: any[]) => {
        return result.map(listing => this.toEtsyListing(listing));
      })
    );
  }

  private callAPI(url: string): Observable<any[]> {
    const apiCallUrl = `${this.URL_BASE}${url}?api_key=${this.config.apiKey}`;
    console.log('Calling url: ', apiCallUrl);
    return Observable.create((observer: Observer<any[]>) => {
      this.limiter.removeTokens(1, () =>
        got(apiCallUrl, {
          json: true
        })
          .then(resp => {
            observer.next(resp.body.results);
            observer.complete();
          })
          .catch(err => console.error(err))
      );
    });
  }

  private toEtsyListing(listing: any): EtsyListing {
    return {
      listingId: listing.listing_id,
      userId: listing.user_id,
      title: listing.title,
      description: listing.description,
      price: listing.price,
      url: listing.url,
      categoryPath: listing.category_path,
      hash: this.toListingHash(listing),
      images: []
    };
  }

  private toListingHash(listing: any): string {
    return md5(
      [
        'listing_id',
        'creation_tsz',
        'ending_tsz',
        'original_creation_tsz',
        'last_modified_tsz'
      ]
        .map(prop => listing[prop].toString())
        .join('')
    );
  }

  private sortEtsyListings(listings: EtsyListing[]): EtsyListing[] {
    return listings.sort((a, b) => a.listingId - b.listingId);
  }

  private toListingsHash(listings: EtsyListing[]): string {
    return md5(listings.map(listing => listing.hash).join(''));
  }

  private getImages(listing: EtsyListing): Observable<EtsyListing> {
    return this.callAPI(`/listings/${listing.listingId}/images`).pipe(
      map((result: any[]) => {
        listing.images = this.toListingImages(result);
        return listing;
      })
    );
  }

  private toListingImages(images: any[]): any[] {
    return images.map(image => this.toListingImage(image));
  }

  private toListingImage(image: any): ListingImage {
    return {
      imageId: image.listing_image_id,
      urls: {
        small: image.url_75x75,
        medium: image.url_170x135,
        large: image.url_570xN,
        full: image.url_fullxfull
      },
      size: {
        height: image.full_height,
        width: image.full_width
      }
    };
  }
}
