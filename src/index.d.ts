export interface PollingCheckpoint {
  getLastHash(): Promise<string>;
  updateHash(currentHash: string): void;
}

export interface ListingProcessor {
  process(listings: EtsyListing[]): void;
}

export interface EtsyListing {
  listingId: number;
  userId: number;
  title: string;
  description: string;
  price: string;
  url: string;
  creationDate: number;
  modifiedDate: number;
  categoryPath: string[];
  hash: string;
  images: ListingImage[];
}

export interface ListingImage {
  imageId: number;
  urls: {
    small: string;
    medium: string;
    large: string;
    full: string;
  };
  size: {
    height: number;
    width: number;
  };
}
