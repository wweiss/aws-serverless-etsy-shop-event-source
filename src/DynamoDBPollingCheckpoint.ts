import { Logger } from '@codificationorg/commons-core';
import { DynamoDB } from 'aws-sdk';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { PollingCheckpoint } from './';

const CHECKPOINT_ATTRIBUTE = 'checkpoint';

export class DynamoDBPollingCheckpoint implements PollingCheckpoint {
  private readonly hashKey = 'CHECKPOINT_HASH';

  private tableName: string;
  private db: DynamoDB = new DynamoDB();

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  public getLastHash(): Observable<string> {
    const params = {
      Key: {
        id: {
          S: this.hashKey,
        },
      },
      TableName: this.tableName,
    };
    return Observable.create((observer: Observer<string>) => {
      this.db.getItem(params, (err, data) => {
        if (err) {
          observer.error(err);
        } else if (data.Item) {
          observer.next(data.Item[CHECKPOINT_ATTRIBUTE].S);
        } else {
          observer.next('');
        }
        observer.complete();
      });
    });
  }

  public updateHash(latestHash: string): void {
    const params = {
      Item: {
        checkpoint: {
          S: latestHash,
        },
        id: {
          S: this.hashKey,
        },
      },
      TableName: this.tableName,
    };
    this.db.putItem(params, (err, data) => {
      if (err) {
        Logger.error('Error while updating checkpoint hash: ', err);
      } else {
        Logger.debug('Checkpoint hash updated: ', latestHash);
      }
    });
  }
}
