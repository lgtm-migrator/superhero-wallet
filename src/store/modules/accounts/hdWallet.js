import { Crypto, TxBuilder, SCHEMA } from '@aeternity/aepp-sdk';
import { decode } from '@aeternity/aepp-sdk/es/tx/builder/helpers';
import { getHdWalletAccount } from '../../../popup/utils/helper';

const type = 'hd-wallet';

export default {
  namespaced: true,

  account: {
    type,
  },

  state: {
    nextAccountIdx: 1,
  },
  actions: {
    async isAccountUsed({ rootState: { sdk } }, address) {
      return sdk.api.getAccountByPubkey(address).then(() => true, () => false);
    },
    async discover({ state, rootGetters, dispatch }) {
      let lastNotEmptyIdx = 0;
      let account;
      // eslint-disable-next-line no-plusplus
      for (let nextIdx = state.nextAccountIdx; nextIdx <= 5; nextIdx++) {
        account = getHdWalletAccount(rootGetters.wallet, nextIdx);
        // eslint-disable-next-line no-await-in-loop
        if (await dispatch('isAccountUsed', account.address)) lastNotEmptyIdx = nextIdx;
      }
      // eslint-disable-next-line no-plusplus
      for (let i = state.nextAccountIdx; i <= lastNotEmptyIdx; i++) {
        dispatch('create', true);
      }
    },
    create({ state, commit }, isRestored = false) {
      commit('accounts/add', { idx: state.nextAccountIdx, type, isRestored }, { root: true });
      state.nextAccountIdx += 1;
    },
    signWithoutConfirmation({ rootGetters: { account } }, data) {
      return Crypto.sign(data, account.secretKey);
    },
    async confirmRawDataSigning({ dispatch }, data) {
      await dispatch('modals/open', { name: 'confirm-raw-sign', data }, { root: true });
    },
    async confirmTxSigning({ dispatch }, { encodedTx, host }) {
      let txObject;
      try {
        txObject = TxBuilder.unpackTx(encodedTx, true).tx;
      } catch (e) {
        await dispatch('confirmRawDataSigning', encodedTx);
        return;
      }
      const SUPPORTED_TX_TYPES = [
        SCHEMA.TX_TYPE.spend,
        SCHEMA.TX_TYPE.contractCreate,
        SCHEMA.TX_TYPE.contractCall,
        SCHEMA.TX_TYPE.namePreClaim,
        SCHEMA.TX_TYPE.nameClaim,
        SCHEMA.TX_TYPE.nameUpdate,
        SCHEMA.TX_TYPE.nameTransfer,
      ];
      if (!SUPPORTED_TX_TYPES.includes(SCHEMA.OBJECT_ID_TX_TYPE[txObject.tag])) {
        await dispatch('confirmRawDataSigning', encodedTx);
        return;
      }

      const checkTransactionSignPermission = await dispatch('permissions/checkTransactionSignPermission', {
        ...txObject,
        host,
      }, { root: true });

      if (!checkTransactionSignPermission) {
        await dispatch(
          'modals/open',
          { name: 'confirm-transaction-sign', transaction: txObject },
          { root: true },
        );
      }
    },
    sign({ dispatch }, data) {
      return dispatch('signWithoutConfirmation', data);
    },
    async signTransaction({ dispatch, rootState: { sdk } }, {
      txBase64,
      opt: { modal = true, host = null },
    }) {
      const encodedTx = decode(txBase64, 'tx');
      if (modal) await dispatch('confirmTxSigning', { encodedTx, host });
      const signature = await dispatch(
        'signWithoutConfirmation',
        Buffer.concat([Buffer.from(sdk.getNetworkId()), Buffer.from(encodedTx)]),
      );
      return TxBuilder.buildTx({ encodedTx, signatures: [signature] }, SCHEMA.TX_TYPE.signed).tx;
    },
  },
};
