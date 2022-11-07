import {
  ref,
  computed,
  onMounted,
  watch,
} from '@vue/composition-api';
import { pick } from 'lodash-es';
import BigNumber from 'bignumber.js';
import { Store } from 'vuex';
import FUNGIBLE_TOKEN_CONTRACT from 'aeternity-fungible-token/FungibleTokenFullInterface.aes';
import { TxBuilder, SCHEMA } from '@aeternity/aepp-sdk';
import { MAGNITUDE, STUB_CONTRACT_ADDRESS, AETERNITY_CONTRACT_ID } from '../popup/utils/constants';
import { rxJsObservableToVueState } from '../popup/utils/utils';

import {
  executeAndSetInterval,
  calculateFee,
  validateTipUrl,
  checkAensName,
  handleUnknownError,
  watchUntilTruthy,
} from '../popup/utils';
import { IAccount } from '../types';

export interface UseMaxAmountOptions {
  store: Store<any>
  formModel: any,
}

export function useMaxAmount({ store, formModel }: UseMaxAmountOptions) {
  const fee = ref(new BigNumber(0));
  const selectedTokenBalance = ref(new BigNumber(0));
  const tokenInstance = ref<any>(null);
  const nonce = ref(0);
  const selectedAssetDecimals = ref(0);

  const balance = rxJsObservableToVueState(store.state.observables.balance);
  const account = computed<IAccount>(() => store.getters.account);
  const max = computed(() => {
    if (balance.value && formModel.value?.selectedAsset?.contractId === AETERNITY_CONTRACT_ID) {
      const _max = balance.value.minus(fee.value);
      return (_max.isPositive() ? _max : 0).toString();
    }
    return selectedTokenBalance.value.toString();
  });

  watch(
    () => formModel.value,
    async (val) => {
      if (!val || !val.selectedAsset) return;
      await watchUntilTruthy(() => store.state.sdk);
      const { sdk } = store.state;

      if (val.selectedAsset.contractId !== AETERNITY_CONTRACT_ID) {
        if (!tokenInstance.value
          || tokenInstance.value.deployInfo.address !== val.selectedAsset.contractId) {
          tokenInstance.value = await store.state.sdk.getContractInstance({
            source: FUNGIBLE_TOKEN_CONTRACT,
            contractAddress: val.selectedAsset.contractId,
          });
        }
        selectedAssetDecimals.value = val.selectedAsset.decimals;
      }

      if (val.selectedAsset.contractId !== AETERNITY_CONTRACT_ID
        || (val.address && !checkAensName(val.address) && validateTipUrl(val.address))) {
        fee.value = calculateFee(
          SCHEMA.TX_TYPE.contractCall, {
            ...sdk.Ae.defaults,
            ttl: 0,
            nonce: nonce.value + 1,
            amount: (new BigNumber(val.amount > 0 ? val.amount : 0)).shiftedBy(MAGNITUDE),
            callerId: account.value.address,
            contractId: validateTipUrl(val.address)
              ? STUB_CONTRACT_ADDRESS : val.selectedAsset.contractId,
          },
        );
        return;
      }
      const minFee = new BigNumber(TxBuilder.calculateMinFee('spendTx', {
        gas: sdk.Ae.defaults.gas,
        params: {
          ...sdk.Ae.defaults,
          senderId: account.value.address,
          recipientId: account.value.address,
          amount: new BigNumber(val.amount > 0 ? val.amount : 0).shiftedBy(MAGNITUDE),
          ttl: 0,
          nonce: nonce.value + 1,
          payload: '',
        },
      })).shiftedBy(-MAGNITUDE);
      if (!minFee.isEqualTo(fee.value)) fee.value = minFee;
    },
    { deep: true },
  );

  onMounted(() => {
    executeAndSetInterval(async () => {
      if (!tokenInstance.value) return;
      await watchUntilTruthy(() => store.state.sdk);
      selectedTokenBalance.value = new BigNumber(
        (await tokenInstance.value.methods.balance(account.value.address)).decodedResult,
      ).shiftedBy(-selectedAssetDecimals.value);
    }, 1000);

    executeAndSetInterval(async () => {
      await watchUntilTruthy(() => store.state.sdk);
      try {
        nonce.value = (await store.state.sdk.api
          .getAccountByPubkey(account.value.address))?.nonce;
      } catch (e: any) {
        if (!e.message.includes('Account not found')) handleUnknownError(e);
      }
    }, 5000);
  });

  return {
    fee,
    selectedTokenBalance,
    tokenInstance,
    nonce,
    selectedAssetDecimals,
    account,
    max,
    balance,
  };
}
