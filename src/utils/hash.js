import {hash, number} from 'starknet';

import {byChainId} from '../enums';
import {fromBytes} from './number';

export const txHash = (fromAddress, toAddress, selector, payload, chainId) => {
  const calldata = [number.hexToDecimalString(fromAddress), ...payload];
  const calldataHash = hash.hashCalldata(calldata);
  const {l2Id} = byChainId(chainId);
  return hash.computeHashOnElements([
    fromBytes('invoke'),
    toAddress,
    selector,
    calldataHash,
    fromBytes(l2Id)
  ]);
};

export const hashEquals = (data1, data2) =>
  hash.computeHashOnElements(data1) === hash.computeHashOnElements(data2);

export const b64e = str =>
  window.btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) =>
      String.fromCharCode('0x' + p1)
    )
  );

export const b64d = str =>
  decodeURIComponent(
    Array.prototype.map.call(window.atob(str), c => '%' + c.charCodeAt(0).toString(16)).join('')
  );
