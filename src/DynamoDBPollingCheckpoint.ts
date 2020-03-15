import { LoggerFactory } from '@codification/cutwater-logging';
import { DynamoDB } from 'aws-sdk';
import { GetItemOutput } from 'aws-sdk/clients/dynamodb';
import { PollingCheckpoint } from './';

const CHECKPOINT_ATTRIBUTE = 'checkpoint';
const Logger = LoggerFactory.getLogger();

export class DynamoDBPollingCheckpoint implements PollingCheckpoint {
  private readonly hashKey = 'CHECKPOINT_HASH';

  private tableName: string;
  private db: DynamoDB = new DynamoDB();

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  public async getLastHash(): Promise<string> {
    const params = {
      Key: {
        id: {
          S: this.hashKey,
        },
      },
      TableName: this.tableName,
    };
    const data: GetItemOutput = await this.db.getItem(params).promise();
    if (data.Item && data.Item[CHECKPOINT_ATTRIBUTE] && data.Item[CHECKPOINT_ATTRIBUTE].S) {
      return data.Item[CHECKPOINT_ATTRIBUTE].S || '';
    }
    return '';
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
