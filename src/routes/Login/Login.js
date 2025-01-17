import {
  ChainInfo,
  LoginErrorType,
  NetworkType,
  WalletErrorType,
  WalletStatus
} from '@starkware-industries/commons-js-enums';
import React, {useEffect, useRef, useState} from 'react';

import {MultiChoiceMenu} from '../../components/UI';
import {
  useEnvs,
  useLoginTracking,
  useLoginTranslation,
  useWalletHandlerProvider
} from '../../hooks';
import {useHideModal, useProgressModal} from '../../providers/ModalProvider';
import {useLoginWallet, useWalletsStatus} from '../../providers/WalletsProvider';
import {evaluate, isChrome, isFirefox} from '../../utils';
import styles from './Login.module.scss';

const MODAL_TIMEOUT_DURATION = 2000;
const AUTO_CONNECT_TIMEOUT_DURATION = 100;

export const Login = () => {
  const {
    titleTxt,
    subtitleTxt,
    downloadTxt,
    modalTxt,
    unsupportedBrowserTxt,
    unsupportedChainIdTxt
  } = useLoginTranslation();
  const [trackLoginScreen, trackDownloadClick, trackWalletClick, trackLoginError] =
    useLoginTracking();
  const {AUTO_CONNECT, SUPPORTED_L1_CHAIN_ID} = useEnvs();
  const [selectedWalletName, setSelectedWalletName] = useState('');
  const [error, setError] = useState(null);
  const [network, setNetwork] = useState(NetworkType.L1);
  const {statusL1, statusL2} = useWalletsStatus();
  const {walletError, walletStatus, connectWallet} = useLoginWallet(network);
  const walletHandlers = useWalletHandlerProvider(network);
  const modalTimeoutId = useRef(null);
  const hideModal = useHideModal();
  const showProgressModal = useProgressModal();

  useEffect(() => {
    trackLoginScreen();
    if (!isBrowserSupported()) {
      setError({type: LoginErrorType.UNSUPPORTED_BROWSER, message: unsupportedBrowserTxt});
    }
  }, []);

  useEffect(() => {
    if (statusL1 !== WalletStatus.CONNECTED) {
      network !== NetworkType.L1 && setNetwork(NetworkType.L1);
    } else if (statusL2 !== WalletStatus.CONNECTED) {
      network !== NetworkType.L2 && setNetwork(NetworkType.L2);
    }
  }, [statusL1, statusL2]);

  useEffect(() => {
    handleModal();
    return () => {
      maybeHideModal();
    };
  }, [walletStatus]);

  useEffect(() => {
    let timeoutId;
    if (error) {
      trackLoginError(error);
    } else if (!error && AUTO_CONNECT) {
      if (walletHandlers.length > 0) {
        timeoutId = setTimeout(
          () => onWalletConnect(walletHandlers[0]),
          AUTO_CONNECT_TIMEOUT_DURATION
        );
      }
    }
    return () => clearTimeout(timeoutId);
  }, [error, walletHandlers]);

  useEffect(() => {
    walletError && handleWalletError(walletError);
  }, [walletError]);

  const isBrowserSupported = () => isChrome() || isFirefox();

  const onWalletConnect = walletHandler => {
    const {config} = walletHandler;
    const {name} = config;
    trackWalletClick(name);
    if (!walletHandler.isInstalled()) {
      return walletHandler.install();
    }
    setSelectedWalletName(name);
    return connectWallet(config);
  };

  const onDownloadClick = () => {
    trackDownloadClick();
    if (walletHandlers.length > 0) {
      return walletHandlers[0].install();
    }
  };

  const handleModal = () => {
    switch (walletStatus) {
      case WalletStatus.CONNECTING:
        maybeShowModal();
        break;
      case WalletStatus.CONNECTED:
        setSelectedWalletName('');
        setError(null);
        maybeHideModal();
        break;
      case WalletStatus.ERROR:
      case WalletStatus.DISCONNECTED:
        maybeHideModal();
        break;
      default:
        break;
    }
  };

  const handleWalletError = error => {
    if (error.name === WalletErrorType.CHAIN_UNSUPPORTED_ERROR) {
      setError({
        type: LoginErrorType.UNSUPPORTED_CHAIN_ID,
        message: evaluate(unsupportedChainIdTxt, {
          chainName: ChainInfo.L1[SUPPORTED_L1_CHAIN_ID].NAME
        })
      });
    }
  };

  const maybeShowModal = () => {
    maybeHideModal();
    modalTimeoutId.current = setTimeout(() => {
      showProgressModal(selectedWalletName, evaluate(modalTxt, {walletName: selectedWalletName}));
    }, MODAL_TIMEOUT_DURATION);
  };

  const maybeHideModal = () => {
    if (typeof modalTimeoutId.current === 'number') {
      clearTimeout(modalTimeoutId.current);
      modalTimeoutId.current = null;
    }
    hideModal();
  };

  const mapLoginWalletsToChoices = () => {
    return walletHandlers.map(walletHandler => {
      const {
        config: {id, description, name, logoPath}
      } = walletHandler;
      return {
        id,
        description,
        isDisabled: !isBrowserSupported(),
        isLoading: walletStatus === WalletStatus.CONNECTING,
        logoPath,
        name,
        onClick: () => onWalletConnect(walletHandler)
      };
    });
  };

  return (
    <div className={styles.login}>
      <MultiChoiceMenu
        choices={mapLoginWalletsToChoices()}
        description={evaluate(subtitleTxt, {networkName: network})}
        error={error}
        footer={
          <div className={styles.download}>
            {downloadTxt[0]} <span onClick={onDownloadClick}>{downloadTxt[1]}</span>
          </div>
        }
        title={titleTxt}
      />
    </div>
  );
};
