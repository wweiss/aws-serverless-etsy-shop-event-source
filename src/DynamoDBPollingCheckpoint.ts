import { DynamoDB } from 'aws-sdk';

import { Observer } from 'rxjs/Observer';
import { Observable } from 'rxjs/Observable';

import { Logger } from './Logger';
import { PollingCheckpoint } from '.';

export class DynamoDBPollingCheckpoint implements PollingCheckpoint {
  private readonly hashKey = 'CHECKPOINT_HASH';
  
  private tableName: string;
  private db: DynamoDB = new DynamoDB();

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  public getLastHash(): Observable<string> {
    const params = {
      Key: { id: { S: this.hashKey } },
      TableName: this.tableName
    };
    return Observable.create((observer: Observer<string>) => {
      this.db.getItem(params, (err, data) => {
        if (err) {
          observer.error(err);
        } else if (data.Item) {
          observer.next(data.Item['checkpoint'].S);
        } else {
          observer.next('');
        }
        observer.complete();
      });
    });
  }

  public updateHash(latestHash: string): void {}
}
