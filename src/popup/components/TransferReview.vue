<template>
  <div class="review-wrapper">
    <ModalHeader
      :title="$t('pages.send.reviewtx')"
      :subtitle="$t('pages.send.checkalert')"
    />

    <DetailsItem
      :label="$t('pages.send.sender')"
      data-cy="review-sender"
    >
      <template #value>
        <AvatarWithChainName
          :address="account.address"
          :name="account.name"
          :show-address="!isRecipientName"
        />
      </template>
    </DetailsItem>

    <DetailsItem
      v-if="isAddressUrl"
      data-cy="review-tip-url"
      class="tip-url"
      :label="$t('pages.send.receivingUrl')"
      :value="transferData.address"
    />
    <DetailsItem
      v-else
      data-cy="review-recipient"
      :label="$t('pages.send.recipient')"
    >
      <template #value>
        <AvatarWithChainName
          :address="transferData.address"
          :name="isAddressChain ? transferData.address : null"
          :show-address="!isAddressChain"
        />
      </template>
    </DetailsItem>

    <DetailsItem
      :label="$t('pages.tipPage.amountLabel')"
    >
      <template #value>
        <TokenAmount
          :amount="+transferData.amount"
          :symbol="tokenSymbol"
          :hide-fiat="isSelectedAssetAex9"
          data-cy="review-total"
        />
      </template>
    </DetailsItem>

    <DetailsItem
      :label="$t('pages.signTransaction.fee')"
    >
      <template #value>
        <TokenAmount
          :amount="+transferData.fee.toFixed()"
          symbol="AE"
          hide-fiat
          high-precision
          data-cy="review-fee"
        />
      </template>
    </DetailsItem>
    <DetailsItem
      v-if="transferData.selectedAsset.contractId === AETERNITY_CONTRACT_ID"
      :label="$t('pages.signTransaction.total')"
    >
      <template #value>
        <TokenAmount
          :amount="+transferData.total"
          symbol="AE"
          hide-fiat
          high-precision
          data-cy="review-fee"
        />
      </template>
    </DetailsItem>
    <Loader v-if="loading" />
  </div>
</template>

<script>
import { SCHEMA } from '@aeternity/aepp-sdk';
import { mapGetters, mapState } from 'vuex';
import deeplinkApi from '../../mixins/deeplinkApi';
import {
  aeToAettos,
  checkAensName,
  convertToken,
  escapeSpecialChars,
} from '../utils';
import { MODAL_DEFAULT, AETERNITY_CONTRACT_ID } from '../utils/constants';
import DetailsItem from './DetailsItem.vue';
import TokenAmount from './TokenAmount.vue';
import AvatarWithChainName from './AvatarWithChainName.vue';
import ModalHeader from './ModalHeader.vue';

export default {
  name: 'TransferReview',
  components: {
    ModalHeader,
    AvatarWithChainName,
    DetailsItem,
    TokenAmount,
  },
  mixins: [deeplinkApi],
  model: {
    prop: 'transferData',
  },
  props: {
    transferData: { type: Object, required: true },
    isAddressChain: Boolean,
    isAddressUrl: Boolean,
  },
  data() {
    return {
      loading: false,
      AETERNITY_CONTRACT_ID,
    };
  },
  computed: {
    ...mapGetters(['account']),
    ...mapState([
      'sdk',
      'tippingV1',
      'tippingV2',
    ]),
    isSelectedAssetAex9() {
      return !!this.transferData.selectedAsset
        && this.transferData.selectedAsset.contractId !== AETERNITY_CONTRACT_ID;
    },
    isRecipientName() {
      return this?.recipientAddress && checkAensName(this.recipientAddress);
    },
    tokenSymbol() {
      return this.transferData.selectedAsset?.symbol || '-';
    },
    tippingContract() {
      return this.tippingV2 || this.tippingV1;
    },
  },
  methods: {
    async submit() {
      const {
        amount: amountRaw,
        address: recipient,
        selectedAsset,
        note,
      } = this.transferData;

      if (!amountRaw || !recipient || !selectedAsset) {
        return;
      }

      const amount = (selectedAsset.contractId === AETERNITY_CONTRACT_ID)
        ? aeToAettos(amountRaw)
        : convertToken(amountRaw, selectedAsset.decimals);

      if (this.isAddressUrl) {
        this.sendTip({
          amount,
          recipient,
          selectedAsset,
          note,
        });
      } else {
        this.transfer({
          amount,
          recipient,
          selectedAsset,
        });
      }
    },
    async transfer({ amount, recipient, selectedAsset }) {
      this.loading = true;
      try {
        let actionResult;

        if (this.transferData.invoiceId != null) {
          actionResult = await this.$store.dispatch('fungibleTokens/burnTriggerPoS', [
            selectedAsset.contractId,
            amount,
            this.transferData.invoiceContract,
            this.transferData.invoiceId,
            { waitMined: false, modal: false },
          ]);
        } else if (selectedAsset.contractId !== AETERNITY_CONTRACT_ID) {
          actionResult = await this.$store.dispatch('fungibleTokens/transfer', [
            selectedAsset.contractId,
            recipient,
            amount,
            { waitMined: false, modal: false },
          ]);
        } else {
          actionResult = await this.sdk.spend(amount, recipient, {
            waitMined: false,
            modal: false,
          });
        }

        if (actionResult && selectedAsset.contractId !== AETERNITY_CONTRACT_ID) {
          this.$store.dispatch('addPendingTransaction', {
            amount,
            recipient,
            hash: actionResult.hash,
            type: 'spendToken',
            pendingTokenTx: true,
            tx: {
              callerId: this.account.address,
              contractId: selectedAsset.contractId,
              type: SCHEMA.TX_TYPE.contractCall,
              function: 'transfer',
            },
          });
        } else if (actionResult) {
          this.$store.dispatch('addPendingTransaction', {
            hash: actionResult.hash,
            amount,
            type: 'spend',
            tx: {
              senderId: this.account.address,
              recipientId: recipient,
              type: SCHEMA.TX_TYPE.spend,
            },
          });
        }
        this.$emit('success');
      } catch (e) {
        this.openTransactionFailedModal();
        throw e;
      } finally {
        this.loading = false;
      }
    },
    async sendTip({
      amount,
      recipient,
      selectedAsset,
      note,
    }) {
      this.loading = true;
      try {
        let txResult = null;
        if (selectedAsset.contractId !== AETERNITY_CONTRACT_ID) {
          await this.$store.dispatch('fungibleTokens/createOrChangeAllowance', [selectedAsset.contractId, this.amount]);
          txResult = await this.tippingV2.methods.tip_token(
            recipient,
            escapeSpecialChars(note),
            selectedAsset.contractId,
            amount,
          );
        } else {
          txResult = await this.tippingContract.call(
            'tip',
            [recipient, escapeSpecialChars(note)],
            {
              amount,
              waitMined: false,
              modal: false,
            },
          );
        }
        this.$store.dispatch('addPendingTransaction', {
          hash: txResult.hash,
          amount,
          tipUrl: recipient,
          tx: {
            callerId: this.account.address,
            contractId: this.tippingContract.deployInfo.address,
            type: SCHEMA.TX_TYPE.contractCall,
            function: 'tip',
            selectedTokenContractId: selectedAsset.contractId,
          },
        });
        this.openCallbackOrGoHome(true);
        this.$emit('success');
      } catch (e) {
        this.openCallbackOrGoHome(false);
        this.openTransactionFailedModal();
        e.payload = { url: recipient };
        throw e;
      } finally {
        this.loading = false;
      }
    },
    openTransactionFailedModal() {
      this.$store.dispatch('modals/open', {
        name: MODAL_DEFAULT,
        title: this.$t('modals.transaction-failed.msg'),
        icon: 'critical',
      });
    },
  },
};
</script>
