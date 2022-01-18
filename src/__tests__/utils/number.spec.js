import {ChainType} from '../../enums';
import {fromBytes} from '../../utils';

it('fromBytes', () => {
  expect(fromBytes('invoke')).toEqual('115923154332517');
  expect(fromBytes(ChainType.GOERLI.l2Id)).toEqual('1536727068981429685321');
  expect(fromBytes(ChainType.MAIN.l2Id)).toEqual('23448594291968334');
});
