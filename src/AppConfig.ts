import { KMS } from 'aws-sdk';
import { Logger } from './Logger';

export class AppConfig {
  private _apiKey: string;

  public readonly shopId: string = process.env['SHOP_ID'];
  public readonly includeImages: boolean = process.env['INCLUDE_IMAGES'] ===
  'true'
    ? true
    : false;
  public readonly requestsPerSecond: number = +process.env[
    'REQUESTS_PER_SECOND'
  ];
  public readonly listingProcessorFunctionName: string = process.env[
    'LISTING_PROCESSOR_FUNCTION_NAME'
  ];
  public readonly tableName: string = process.env[
    'POLLING_CHECKPOINT_TABLE_NAME'
  ];

  get apiKey(): string {
    if (!this._apiKey) {
      const encryptedApiKey = process.env['ENCRYPTED_API_KEY'];
      if (encryptedApiKey) {
        this.decryptApiKey(encryptedApiKey);
      }
      if (this._apiKey) {
        Logger.info('Found and decrypted API Key.');
      } else {
        Logger.warn(
          'Encrypted API Key not found or could not be decrypted, trying plaintext.'
        );
        this._apiKey = process.env['PLAINTEXT_API_KEY'];
      }
    }
    return this._apiKey;
  }

  private async decryptApiKey(encryptedApiKey: string) {
    const kms = new KMS();
    const params = {
      CiphertextBlob: new Buffer(encryptedApiKey, 'base64')
    };
    await kms.decrypt(params, (err, data) => {
      if (err) {
        Logger.error('Error decrypting API Key: ', err);
      } else {
        this._apiKey = data.Plaintext.toString();
      }
    });
  }
}
