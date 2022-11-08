import { computed } from '@vue/composition-api';
import { camelCase } from 'lodash-es';
import { IToken, ITransaction } from '../types';
import store from '../store';
import * as TransactionResolver from '../popup/utils/transactionTokenInfoResolvers';

import {
  AETERNITY_SYMBOL, convertToken, FUNCTION_TYPE_DEX, MAGNITUDE,
} from '../popup/utils';

export const useTransactionToken = (
  transaction: ITransaction,
  showDetailedAllowanceInfo?: boolean,
) => {
  const state = store.state as any;

  // TODO add Type for all computed
  const availableTokens = computed<Record<string, IToken>>(() => state['fungibleTokens/availableTokens']);
  const getTxAmountTotal = computed(() => store.getters.getTxAmountTotal);
  const getTxSymbol = computed(() => store.getters.getTxSymbol);
  const getTxType = computed(() => store.getters.getTxType);
  const getTxDirection = computed(() => store.getters.getTxDirection);
  const account = computed(() => store.getters.account);
  const getDexContracts = computed(() => store.getters.getDexContracts);

  const txType = computed(() => getTxType.value(transaction));

  const isAllowance = computed(() => FUNCTION_TYPE_DEX.allowance.includes(transaction?.tx?.function)
      && availableTokens.value[transaction?.tx?.contractId]);

  const transactionFunction = computed(() => {
    const functionName = camelCase(transaction?.tx?.function || '');

    // TODO this line need refactor in TransactionResolver
    // @ts-ignore
    return TransactionResolver[functionName as string];
  });

  const tokens = computed(() => {
    if (!transaction
      && transactionFunction.value
      && (!isAllowance.value || showDetailedAllowanceInfo)) {
      return transactionFunction.value(transaction, availableTokens.value).tokens;
    }

    return [{
      ...transaction?.tx || {},
      amount: isAllowance.value
        ? convertToken(transaction.tx.fee, -MAGNITUDE)
        : getTxAmountTotal.value(transaction),
      symbol: isAllowance.value ? AETERNITY_SYMBOL : getTxSymbol.value(transaction),
      isReceived: getTxDirection.value(transaction) === 'received',
      isAe: isAllowance.value || getTxSymbol.value(transaction) === AETERNITY_SYMBOL,
    }];
  });

  const isErrorTransaction = computed(() => transaction?.tx?.returnType && transaction?.tx?.returnType !== 'ok');

  const isDex = computed(() => transactionFunction.value
      && (getDexContracts.value.router.includes(transaction?.tx?.contractId)
        || getDexContracts.value.includes(transaction?.tx?.contractId)));

  return {
    txType,
    tokens,
    isAllowance,
    isErrorTransaction,
    isDex,
    availableTokens,
    getTxAmountTotal,
    getTxSymbol,
    getTxType,
    getTxDirection,
    account,
    getDexContracts,
  };
};
