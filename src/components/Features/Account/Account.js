import PropTypes from 'prop-types';
import React, {createRef, useEffect, useRef, useState} from 'react';

import {ReactComponent as CollapseIcon} from '../../../assets/svg/icons/collapse.svg';
import {LINKS} from '../../../constants';
import {useCompleteTransferToL1} from '../../../hooks';
import {useAccountTransfers} from '../../../providers/TransfersProvider';
import {useWallets} from '../../../providers/WalletsProvider';
import {findIndexById, toClasses} from '../../../utils';
import {AccountAddress, BackButton, LogoutButton, Menu, MenuTitle} from '../../UI';
import {LinkButton} from '../../UI/LinkButton/LinkButton';
import stylesLog from '../../UI/TransferLogContainer/TransferLogContainer.module.scss';
import {
  EMPTY_MSG_TXT,
  OVERVIEW_TXT,
  TITLE_TXT as TITLE_TXT_LOG,
  VIEW_MORE_TXT
} from '../../UI/TransferLogContainer/TransferLogContainer.strings';
import {useBridgeActions} from '../Bridge/Bridge.hooks';
import {useTransferData} from '../Transfer/Transfer.hooks';
import {TransferLog} from '../TransferLog/TransferLog';
import styles from './Account.module.scss';
import {TITLE_TXT} from './Account.strings';

export const Account = ({transferId}) => {
  const {showTransferMenu} = useBridgeActions();
  const {account, chainId, resetWallet} = useWallets();
  const {isL1, isL2, fromNetwork} = useTransferData();
  const completeTransferToL1 = useCompleteTransferToL1();
  const transfers = useAccountTransfers(account);
  const [transferIndex, setTransferIndex] = useState(-1);
  const {resetMenuProps} = useBridgeActions();
  const [showChildren, setShowChildren] = useState(false);
  let scrollRefs = useRef([]);
  const containerRef = useRef();

  useEffect(() => {
    if (!transfers) return;
    scrollRefs.current = transfers.reduce((acc, value, index) => {
      return acc[index] ? '' : acc.concat(createRef());
    }, []);
  }, [transfers]);

  useEffect(() => {
    setTransferIndex(findIndexById(transfers, transferId));
  }, [transferId, transfers]);

  useEffect(() => {
    if (transferIndex > -1) {
      setShowChildren(true);
      setTimeout(() => {
        scrollRefs.current[transferIndex]?.current?.scroll();
        resetMenuProps();
      }, 100);
    } else {
      containerRef.current.scrollTop = 0;
    }
  }, [transferId, transferIndex]);

  const toggleShowChildren = () => {
    setShowChildren(!showChildren);
  };

  return (
    <Menu>
      <div className={styles.account}>
        <BackButton onClick={showTransferMenu} />
        <MenuTitle text={TITLE_TXT(fromNetwork.name)} />
        <AccountAddress address={account} />
        {isL1 && (
          <LinkButton
            text={LINKS.ETHERSCAN.text}
            url={LINKS.ETHERSCAN.accountUrl(chainId, account)}
          />
        )}
        {isL2 && (
          <LinkButton text={LINKS.VOYAGER.text} url={LINKS.VOYAGER.accountUrl(chainId, account)} />
        )}

        <div ref={containerRef} className={stylesLog.transferLogContainer}>
          <div className={toClasses(stylesLog.title, showChildren && stylesLog.showChildren)}>
            {TITLE_TXT_LOG}
            {transfers && (
              <div>
                <CollapseIcon onClick={toggleShowChildren} />
              </div>
            )}
          </div>
          {!transfers ? (
            <div className={stylesLog.empty}>{EMPTY_MSG_TXT}</div>
          ) : showChildren ? (
            transfers.map((transfer, index) => (
              <TransferLog
                key={index}
                ref={scrollRefs.current[index]}
                transfer={transfer}
                onCompleteTransferClick={() => completeTransferToL1(transfer)}
              />
            ))
          ) : !showChildren ? (
            <div className={stylesLog.viewMore}>
              {Array.isArray(transfers) ? transfers.length : 1} {OVERVIEW_TXT}{' '}
              <span onClick={toggleShowChildren}>{VIEW_MORE_TXT}</span>
            </div>
          ) : null}
        </div>

        <LogoutButton isDisabled={isL2} onClick={resetWallet} />
      </div>
    </Menu>
  );
};

Account.propTypes = {
  transferId: PropTypes.string
};
