<template>
  <div class="transaction-list-wrapper">
    <TransactionList
      :search-term="searchTerm"
      display-filter
      sticky-filter
    />
  </div>
</template>

<script>
import TransactionList from '../components/TransactionList.vue';

export default {
  components: {
    TransactionList,
  },
  props: {
    searchTerm: { type: String, default: '' },
  },
};
</script>

<style lang="scss" scoped>
.transaction-list-wrapper {
  --filter-top-offset: 175px;

  ::v-deep .filters {
    position: sticky;
    margin-top: calc(-1 * var(--gap));
    top: calc(var(--filter-top-offset) + env(safe-area-inset-top));
  }
}
</style>
