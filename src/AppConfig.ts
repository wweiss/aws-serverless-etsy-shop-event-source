import { KMS } from 'aws-sdk';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { Observer } from 'rxjs/Observer';

import { Logger } from './Logger';

export class AppConfig {
  private _apiKey: string;

  public readonly shopId: string = process.env['SHOP_ID'];
  public readonly includeImages: boolean =
    process.env['INCLUDE_IMAGES'] === 'true' ? true : false;
  public readonly requestsPerSecond: number = +process.env[
    'REQUESTS_PER_SECOND'
  ];
  public readonly listingProcessorFunctionName: string =
    process.env['LISTING_PROCESSOR_FUNCTION_NAME'];
  public readonly tableName: string =
    process.env['POLLING_CHECKPOINT_TABLE_NAME'];

  get apiKey(): Observable<string> {
    let rval: Observable<string>;
    if (!this._apiKey) {
      this._apiKey = process.env['PLAINTEXT_API_KEY'];
      const encryptedApiKey = process.env['ENCRYPTED_API_KEY'];
      if (encryptedApiKey) {
        rval = this.decryptApiKey(encryptedApiKey);
      } else {
        Logger.warn('Encrypted API Key not found, using plaintext.');
        rval = of(this._apiKey);
      }
    } else {
      rval = of(this._apiKey);
    }
    return rval;
  }

  private decryptApiKey(encryptedApiKey: string): Observable<string> {
    const kms = new KMS();
    const params = {
      CiphertextBlob: new Buffer(encryptedApiKey, 'base64')
    };
    return Observable.create((observer: Observer<string>) => {
      kms.decrypt(params, (err, data) => {
        if (err) {
          Logger.error('Error decrypting API Key: ', err.message);
        } else {
          Logger.info('Found and decrypted API Key.');
          this._apiKey = data.Plaintext.toString();
        }
        observer.next(this._apiKey);
        observer.complete();
      });
    });
  }
}
