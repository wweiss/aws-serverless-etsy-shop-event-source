import {KMS} from "aws-sdk";

export class AppConfig {
    private _apiKey : string;

    public shopId : string = process.env['SHOP_ID'];
    public includeImages : boolean = process.env['INCLUDE_IMAGES'] === 'true'
        ? true
        : false;
    public requestsPerSecond : number = +process.env['REQUESTS_PER_SECOND'];

    get apiKey() : string {
        if(!this._apiKey) {
            const encryptedApiKey = process.env['ENCRYPTED_API_KEY'];
            if (!encryptedApiKey) {
                this._apiKey = process.env['PLAINTEXT_API_KEY'];
            } else {
                this.decryptApiKey(encryptedApiKey);
            }
        }
        return this._apiKey;
    }

    private async decryptApiKey(encryptedApiKey : string) {
        const kms = new KMS();
        const params = {
            CiphertextBlob: new Buffer(encryptedApiKey, 'base64')
        };
        await kms.decrypt(params, (err, data) => {
            if (err) {} else {
                this._apiKey = data
                    .Plaintext
                    .toString();
            }
        })
    }

    public static env(key : string, defaultValue : string = '') : string {
        let rval = process.env[key];
        if (rval == null) {
            rval = defaultValue;
        }
        return rval;
    }
}