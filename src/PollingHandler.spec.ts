
import * as test from 'tape';
import { PollingHandler } from './PollingHandler';

test('PollingHandler Unit Tests', t => {
  t.plan(1);

  const handler = new PollingHandler('');

  handler.getActiveListings('').subscribe(
    (response) => {
      t.isNot(response,null,'returns non null response');
      console.log('Response: ',response.length);
    }
  )
});