import { KMS } from "aws-sdk";

export class AppConfig {
    private _apiKey: string;

    get apiKey(): string {
        if(!this._apiKey){
            if(!process.env['ENCRYPTED_API_KEY']){
                this._apiKey = process.env['PLAINTEXT_API_KEY'];
            }else{
                const kms = new KMS();
                const params = {CiphertextBlob: process.env['ENCRYPTED_API_KEY']};
                kms.decrypt(params,(err,data) => {
                    if(err){

                    }else{
                        ;
                    }
                })
            }
        }
        return this._apiKey;
    }

    public static env(key: string, defaultValue: string = ''): string {
        let rval = process.env[key];
        if (rval == null) {
          rval = defaultValue;
        }
        return rval;
      }
}