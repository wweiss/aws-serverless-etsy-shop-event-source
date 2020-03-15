import { Config } from '@codification/cutwater-core';
import { LoggerFactory } from '@codification/cutwater-logging';
import { KMS } from 'aws-sdk';
import { DecryptResponse } from 'aws-sdk/clients/kms';

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

const Logger = LoggerFactory.getLogger();

export class AppConfig {
  public readonly shopId: string = Config.getRequired(EnvVar.shopId);
  public readonly perRequestTimeout: number = +Config.getRequired(EnvVar.perRequestTimeout);
  public readonly includeImages: boolean = Config.get(EnvVar.includeImages) === 'true' ? true : false;
  public readonly requestsPerSecond: number = +Config.getRequired(EnvVar.requestsPerSecond);
  public readonly listingProcessorFunctionName: string = Config.getRequired(EnvVar.listingProcessor);
  public readonly tableName: string = Config.getRequired(EnvVar.pollingCheckpointTable);

  private cachedApiKey: string;

  public get apiKey(): Promise<string> {
    let rval: Promise<string>;
    if (!this.cachedApiKey) {
      this.cachedApiKey = Config.get(EnvVar.plainTextApiKey);
      const encryptedApiKey = Config.get(EnvVar.encryptedApiKey);
      if (encryptedApiKey) {
        rval = this.decryptApiKey(encryptedApiKey);
      } else {
        Logger.warn('Encrypted API Key not found, using plaintext.');
        rval = Promise.resolve(this.cachedApiKey);
      }
    } else {
      rval = Promise.resolve(this.cachedApiKey);
    }
    return rval;
  }

  private async decryptApiKey(encryptedApiKey: string): Promise<string> {
    const kms = new KMS();
    const params = {
      CiphertextBlob: new Buffer(encryptedApiKey, 'base64'),
    };
    try {
      const data: DecryptResponse = await kms.decrypt(params).promise();
      Logger.debug('Found and decrypted API Key.');
      if (!!data && !!data.Plaintext) {
        this.cachedApiKey = data.Plaintext.toString();
      }
    } catch (err) {
      Logger.error('Error decrypting API Key: ', err.message);
    }
    return this.cachedApiKey;
  }
}
