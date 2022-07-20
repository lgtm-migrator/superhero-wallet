<template>
  <div
    :class="[
      'account-card',
      { subaccount: idx !== 0, 'first-subaccount': idx === 1, minified: cardMinified }]"
    :style="cardCssProps"
  >
    <div class="account-info">
      <AccountInfo
        v-bind="$attrs"
        :color="color"
      />
    </div>
    <div class="balance-info">
      <BalanceInfo v-bind="$attrs" />
    </div>
    <div class="misc">
      <div class="total-tokens">
        <span class="digit">
          {{ totalTokens }}
        </span>
        <span class="wording">
          {{ $t('pages.fungible-tokens.tokens') }}
        </span>
      </div>
      <div
        class="receiveIcon"
        :to="{ name: 'name-claim' }"
      >
        <ReceiveIcon
          :style="iconCssProps"
        />
      </div>
      <div
        class="sendIcon"
        :to="{ name: 'name-claim' }"
      >
        <SendIcon
          :style="iconCssProps"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import AccountInfo from './AccountInfo.vue';
import BalanceInfo from './BalanceInfo.vue';
import ReceiveIcon from '../../../icons/account-card/account-receive.svg?vue-component';
import SendIcon from '../../../icons/account-card/account-send.svg?vue-component';
import { getAddressColor } from '../../utils/avatar';

export default {
  components: {
    AccountInfo,
    BalanceInfo,
    SendIcon,
    ReceiveIcon,
  },
  props: {
    idx: { type: Number, required: true },
    shift: { type: Number, required: true },
  },
  computed: {
    ...mapState(['cardMinified']),
    ...mapGetters('fungibleTokens', ['getTokenBalance']),
    ...mapGetters(['accounts']),
    cardCssProps() {
      return { 'background-color': this.color };
    },
    totalTokens() {
      return this.getTokenBalance(this.accounts[this.idx].address).length;
    },
    color() {
      return getAddressColor(this.accounts[this.idx].address);
    },
    iconCssProps() {
      return {
        '--primaryColor': this.color,
      };
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.account-card {
  display: flex;
  flex-direction: column;
  width: 328px;
  height: 192px;
  border-radius: 12px;
  margin: 8px 16px 32px 16px;
  align-items: flex-start;

    .account-info {
      flex: 1.3;
    }

    .balance-info {
      flex:1.7;
      align-self: center;
      margin-bottom: 0;
    }

    .misc {
      flex:1;
      margin-left: 12px;
      margin-bottom: 12px;
      width: 100%;
      display:flex;
      flex-direction: row;
      align-items: flex-end;

      .total-tokens {
        @extend %face-sans-14-medium;
        order:1;

        .wording {
          opacity: 0.85;
        }
      }

      .receiveIcon {
        order:2;
        align-self: flex-end;
        margin-left: auto;

        svg path{
          fill: var(--primaryColor);
        }
      }

      .sendIcon {
        order:3;
        align-self: flex-end;
        margin-left: 8px;
        margin-right: 28px;

        path{
          fill: var(--primaryColor);
        }
      }
    }
}
</style>
