import { DynamoDB } from 'aws-sdk';

import { Observable } from 'rxjs/Observable';

import { PollingCheckpoint } from '.';

export class DynamoDBPollingCheckpoint implements PollingCheckpoint {
  private tableName: string;
  private db: DynamoDB = new DynamoDB();

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  public getLastHash(): Observable<string> {
    return null;
  }

  public updateHash(latestHash: string): void {}
}
