import { KMS } from 'aws-sdk';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { Observer } from 'rxjs/Observer';

import { Logger } from './Logger';

export enum EnvVar {
  shopId = 'SHOP_ID',
  perRequestTimeout = 'PER_REQUEST_TIMEOUT',
  includeImages = 'INCLUDE_IMAGES',
  requestsPerSecond = 'REQUESTS_PER_SECOND',
  listingProcessor = 'LISTING_PROCESSOR_FUNCTION_NAME',
  pollingCheckpointTable = 'POLLING_CHECKPOINT_TABLE_NAME',
  plainTextApiKey = 'PLAINTEXT_API_KEY',
  encryptedApiKey = 'ENCRYPTED_API_KEY',
}

export class AppConfig {
  public readonly shopId: string = process.env[EnvVar.shopId];
  public readonly perRequestTimeout: number = +process.env[EnvVar.perRequestTimeout];
  public readonly includeImages: boolean = process.env[EnvVar.includeImages] === 'true' ? true : false;
  public readonly requestsPerSecond: number = +process.env[EnvVar.requestsPerSecond];
  public readonly listingProcessorFunctionName: string = process.env[EnvVar.listingProcessor];
  public readonly tableName: string = process.env[EnvVar.pollingCheckpointTable];

  private cachedApiKey: string;

  public get apiKey(): Observable<string> {
    let rval: Observable<string>;
    if (!this.cachedApiKey) {
      this.cachedApiKey = process.env[EnvVar.plainTextApiKey];
      const encryptedApiKey = process.env[EnvVar.encryptedApiKey];
      if (encryptedApiKey) {
        rval = this.decryptApiKey(encryptedApiKey);
      } else {
        Logger.warn('Encrypted API Key not found, using plaintext.');
        rval = of(this.cachedApiKey);
      }
    } else {
      rval = of(this.cachedApiKey);
    }
    return rval;
  }

  private decryptApiKey(encryptedApiKey: string): Observable<string> {
    const kms = new KMS();
    const params = {
      CiphertextBlob: new Buffer(encryptedApiKey, 'base64'),
    };
    return Observable.create((observer: Observer<string>) => {
      kms.decrypt(params, (err, data) => {
        if (err) {
          Logger.error('Error decrypting API Key: ', err.message);
        } else {
          Logger.info('Found and decrypted API Key.');
          this.cachedApiKey = data.Plaintext.toString();
        }
        observer.next(this.cachedApiKey);
        observer.complete();
      });
    });
  }
}
