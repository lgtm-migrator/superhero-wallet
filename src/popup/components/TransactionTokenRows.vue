<template>
  <div class="transaction-token-rows">
    <div
      v-for="token in tokens.filter(({ amount }) => amount != null)"
      :key="token.symbol"
      :class="['token-row', token.isReceived ? 'received': 'sent', { error }]"
    >
      <Tokens
        :tokens="token.isPool ? [tokens[0], tokens[1]] : [token]"
        :icon-size="iconSize"
      />
      <span class="amount">
        {{
          `${token.isReceived ? '+' : '−'}
          ${amountRounded(token.decimals
          ? convertToken(token.amount || 0, -token.decimals) : token.amount)}`
        }}
      </span>
    </div>
  </div>
</template>

<script>
import { amountRounded, convertToken } from '../utils';
import Tokens from './Tokens.vue';

export default {
  components: { Tokens },
  props: {
    tokens: { type: Array, required: true },
    iconSize: { type: String, default: 'rg' },
    error: Boolean,
  },
  methods: {
    convertToken,
    amountRounded,
  },
};
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.transaction-token-rows {
  width: 100%;

  .token-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;

    @extend %face-sans-15-regular;

    &.error .amount {
      color: variables.$color-grey-dark;
    }

    &.received:not(.error) .amount {
      color: variables.$color-success-dark;
    }

    &.sent:not(.error) .amount {
      color: variables.$color-danger;
    }

    .tokens {
      @extend %face-sans-15-regular;

      color: variables.$color-white;
    }
  }
}
</style>
