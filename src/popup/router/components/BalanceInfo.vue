<template>
  <div
    class="balance-info"
    data-cy="balance-info"
  >
    <div class="balance-wrapper">
      <AeBalance :balance="Number(balances[idx])" />
      <Dropdown
        v-if="currentToken === 'default'"
        :options="currenciesOptions"
        :method="switchCurrency"
        class="currenciesgroup"
        data-cy="currency-dropdown"
      >
        <template slot="display">
          <span class="approx-sign">≈</span>
          <span class="display-value">
            {{ formatCurrency(balances[idx] * currentCurrencyRate) }}
          </span>
          <Arrow
            v-show="false"
            class="expand-arrow"
          />
        </template>
      </Dropdown>
    </div>
  </div>
</template>

<script>
import { pick } from 'lodash-es';
import { mapGetters, mapState } from 'vuex';
import Arrow from '../../../icons/arrow.svg?vue-component';
import Dropdown from './Dropdown.vue';
import AeBalance from './AeBalance.vue';

export default {
  components: {
    Dropdown,
    AeBalance,
    Arrow,
  },
  props: {
    accountIdx: { type: Number, default: -1 },
  },
  subscriptions() {
    return pick(this.$store.state.observables, ['balances']);
  },
  computed: {
    ...mapState('accounts', ['activeIdx']),
    ...mapState(['current', 'currencies']),
    ...mapGetters('fungibleTokens', ['getTokenBalance', 'getSelectedToken']),
    ...mapGetters(['formatCurrency', 'currentCurrencyRate', 'accounts']),
    tokenBalancesOptions() {
      return [
        {
          value: 'default',
          text: `${this.balances[this.idx].toFixed(2)} ${this.$t('ae')}`,
        },
        ...this.tokenBalances.filter((b) => +b?.convertedBalance),
      ];
    },
    currenciesOptions() {
      return Object.keys(this.currencies).map((currencyKey) => ({
        text: currencyKey.toUpperCase(),
        value: currencyKey,
      }));
    },
    currentToken() {
      return this.selectedToken ? this.selectedToken.value : 'default';
    },
    idx() {
      return this.accountIdx === -1 ? this.activeIdx : this.accountIdx;
    },
    tokenBalances() {
      return this.getTokenBalance(this.accounts[this.idx].address);
    },
    selectedToken() {
      return this.getSelectedToken(this.accounts[this.idx].address);
    },
  },
  methods: {
    async switchCurrency(selectedCurrency) {
      this.$store.commit('setCurrentCurrency', selectedCurrency);
    },
    changeToken(token) {
      this.$store.commit('fungibleTokens/setSelectedToken', {
        address: this.accounts[this.idx].address,
        token: token !== 'default' ? this.tokenBalances.find(({ value }) => value === token) : null,
      });
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.balance-info {
  .balance-wrapper {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-content: center;;

    .dropdown {
      text-align: center;

      &:only-child {
        text-align: center;
      }

      &.currenciesgroup {
        @extend %face-sans-16-medium;
        line-height: 18px;
        opacity: 0.75;

        .approx-sign {
          vertical-align: top;
          color: variables.$color-white;
        }
      }

      ::v-deep {
        .content {
          display: flex;
          flex-direction: column;
          align-items: center;
          background-color: transparent;
        }

        .list .button-plain {
          @extend %face-sans-16-regular;
        }
      }
    }
  }
}
</style>
