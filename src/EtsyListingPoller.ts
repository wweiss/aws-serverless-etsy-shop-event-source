import { LoggerFactory } from '@codification/cutwater-logging';
import { default as got } from 'got';
import { RateLimiter } from 'limiter';
import * as md5 from 'md5';
import { EtsyListing, ListingImage, ListingProcessor, PollingCheckpoint } from './';
import { AppConfig } from './AppConfig';

const Logger = LoggerFactory.getLogger();

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
    this.doPoll()
      .then(results => this.processor.process(results))
      .catch(err => Logger.error('Polling encountered an error: ', err));
  }

  public async doPoll(): Promise<EtsyListing[]> {
    const sortedListings: EtsyListing[] = this.sortEtsyListings(await this.getActiveListings());
    Logger.debug('Recieved listings: ', sortedListings.length);

    const lastHash: string = await this.checkpoint.getLastHash();
    Logger.debug('Received previous checkpoint hash: ', lastHash);
    const currentHash = this.toListingsHash(sortedListings);
    Logger.debug('Calculated current hash: ', currentHash);

    if (currentHash === lastHash) {
      Logger.debug('Exiting, no changes detected.');
      return [];
    } else {
      Logger.debug('Updating checkpoint hash.');
      this.checkpoint.updateHash(currentHash);
      if (this.config.includeImages) {
        await Promise.all(sortedListings.map(listing => this.getImages(listing)));
      }
      return sortedListings;
    }
  }

  private async getActiveListings(): Promise<EtsyListing[]> {
    const results: any[] = await this.callAPI(`/shops/${this.config.shopId}/listings/active`);
    return results.map(listing => this.toEtsyListing(listing));
  }

  private callAPI(url: string): Promise<any[]> {
    const baseUrl = `${this.URL_BASE}${url}`;
    return new Promise((resolve, reject) => {
      this.limiter.removeTokens(1, () => {
        this.config.apiKey
          .then(apiKey => {
            return got(`${baseUrl}?api_key=${apiKey}`, {
              json: true,
              timeout: this.config.perRequestTimeout,
            });
          })
          .then(resp => resolve(resp.body.results))
          .catch(err => reject(err));
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

  private async getImages(listing: EtsyListing): Promise<EtsyListing> {
    const results: any[] = await this.callAPI(`/listings/${listing.listingId}/images`);
    listing.images = this.toListingImages(results);
    Logger.debug(`Fetched images for listing[${listing.listingId}]: ${listing.title}`);
    return listing;
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
