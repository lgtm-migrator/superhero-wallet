<template>
  <div class="auction-overview">
    <DetailsItem :label="$t('pages.auctionBid.current-highest-bid')">
      <template #value>
        <TokenAmount
          :amount="+getHighestBid(name).nameFee"
        />
      </template>
    </DetailsItem>
    <DetailsItem
      class="end-height"
      :label="$t('pages.auctionBid.ending-height')"
      :value="auction.expiration"
      :secondary="`(≈${blocksToRelativeTime(blocksToExpiry)})`"
    />
  </div>
</template>

<script>
import { pick } from 'lodash-es';
import { mapGetters } from 'vuex';
import { blocksToRelativeTime } from '../utils';
import DetailsItem from './DetailsItem.vue';
import TokenAmount from './TokenAmount.vue';

export default {
  components: {
    DetailsItem,
    TokenAmount,
  },
  props: {
    name: { type: String, required: true },
  },
  subscriptions() {
    return pick(this.$store.state.observables, ['topBlockHeight']);
  },
  computed: {
    ...mapGetters('names', ['getAuction', 'getHighestBid']),
    auction() {
      return this.getAuction(this.name);
    },
    blocksToExpiry() {
      return this.auction.expiration - this.topBlockHeight;
    },
  },
  methods: {
    blocksToRelativeTime,
  },
};
</script>

<style lang="scss" scoped>
@use '../../styles/variables';

.auction-overview {
  display: flex;

  .details-item {
    ::v-deep .label {
      margin-bottom: 4px;
    }

    ::v-deep .value {
      text-align: left;
    }

    &:first-of-type {
      padding-right: 24px;
    }

    &.end-height {
      ::v-deep .value {
        color: variables.$color-grey-light;
      }

      ::v-deep .secondary {
        color: variables.$color-grey-dark;
      }
    }
  }
}
</style>
