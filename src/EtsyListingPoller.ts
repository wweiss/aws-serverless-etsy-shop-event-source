import { Logger } from '@codificationorg/commons-core';
import * as got from 'got';
import { RateLimiter } from 'limiter';
import * as md5 from 'md5';
import { Observable } from 'rxjs/Observable';
import { EmptyObservable } from 'rxjs/observable/EmptyObservable';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { of } from 'rxjs/observable/of';
import { Observer } from 'rxjs/Observer';
import { flatMap, map, retry } from 'rxjs/operators';
import { EtsyListing, ListingImage, ListingProcessor, PollingCheckpoint } from './';
import { AppConfig } from './AppConfig';

export class EstyListingPoller {
  private readonly URL_BASE = 'https://openapi.etsy.com/v2';

  private config: AppConfig;
  private limiter: RateLimiter;
  private processor: ListingProcessor;
  private checkpoint: PollingCheckpoint;

  constructor(config: AppConfig, checkpoint: PollingCheckpoint, processor: ListingProcessor) {
    this.config = config;
    this.processor = processor;
    this.checkpoint = checkpoint;
    this.limiter = new RateLimiter(this.config.requestsPerSecond, 'second');
  }

  public poll(): void {
    this.doPoll().subscribe(
      pollResults => {
        this.processor.process(pollResults);
      },
      err => Logger.error('Polling encountered an error: ', err),
    );
  }

  public doPoll(): Observable<EtsyListing[]> {
    return forkJoin(this.getActiveListings(), this.checkpoint.getLastHash()).pipe(
      flatMap(results => {
        const sortedListings = this.sortEtsyListings(results[0]);
        Logger.debug('Recieved listings: ', sortedListings.length);
        const lastHash = results[1];
        Logger.debug('Received previous checkpoint hash: ', lastHash);
        const currentHash = this.toListingsHash(sortedListings);
        Logger.debug('Calculated current hash: ', currentHash);

        if (currentHash === lastHash) {
          Logger.debug('Exiting, no changes detected.');
          return new EmptyObservable();
        } else {
          Logger.debug('Updating checkpoint hash.');
          this.checkpoint.updateHash(currentHash);
          return this.config.includeImages
            ? forkJoin(sortedListings.map(listing => this.getImages(listing)))
            : of(sortedListings);
        }
      }),
    );
  }

  private getActiveListings(): Observable<EtsyListing[]> {
    return this.callAPI(`/shops/${this.config.shopId}/listings/active`).pipe(
      map((result: any[]) => {
        return result.map(listing => this.toEtsyListing(listing));
      }),
      retry(3),
    );
  }

  private callAPI(url: string): Observable<any[]> {
    const baseUrl = `${this.URL_BASE}${url}`;
    return Observable.create((observer: Observer<any[]>) => {
      this.limiter.removeTokens(1, () => {
        this.config.apiKey.subscribe(apiKey => {
          Logger.debug('Calling api url: ', baseUrl);
          got(`${baseUrl}?api_key=${apiKey}`, {
            json: true,
            timeout: this.config.perRequestTimeout,
          })
            .then(resp => {
              observer.next(resp.body.results);
              observer.complete();
            })
            .catch(err => observer.error(err));
        });
      });
    });
  }

  private toEtsyListing(listing: any): EtsyListing {
    return {
      categoryPath: listing.category_path,
      creationDate: listing.creation_tsz,
      description: listing.description,
      hash: this.toListingHash(listing),
      images: [],
      listingId: listing.listing_id,
      modifiedDate: listing.last_modified_tsz,
      price: listing.price,
      title: listing.title,
      url: listing.url,
      userId: listing.user_id,
    };
  }

  private toListingHash(listing: any): string {
    return md5(
      ['listing_id', 'creation_tsz', 'ending_tsz', 'original_creation_tsz', 'last_modified_tsz']
        .map(prop => listing[prop].toString())
        .join(''),
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
        Logger.debug(`Fetched images for listing[${listing.listingId}]: ${listing.title}`);
        return listing;
      }),
      retry(3),
    );
  }

  private toListingImages(images: any[]): any[] {
    return images.map(image => this.toListingImage(image));
  }

  private toListingImage(image: any): ListingImage {
    return {
      imageId: image.listing_image_id,
      size: {
        height: image.full_height,
        width: image.full_width,
      },
      urls: {
        full: image.url_fullxfull,
        large: image.url_570xN,
        medium: image.url_170x135,
        small: image.url_75x75,
      },
    };
  }
}
