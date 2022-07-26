<template>
  <div
    class="account-switcher"
    :class="{ 'notification-above': notification }"
  >
    <div
      :class="['cards-wrapper', { 'menu-under': filteredAccounts.length > 1 }]"
      :style="cssVars"
    >
      <AccountCard
        v-for="account in filteredAccounts"
        :key="account.address"
        :class="{ selected: account.i === activeIdx }"
        v-bind="account"
        :account-idx="account.i"
      />
    </div>
    <div
      class="buttons"
    >
      <ButtonPlain
        v-for="(account, idx) in filteredAccounts"
        :key="idx"
        :class="{ selected: account.i === activeIdx }"
        @click="selectAccount(account.i)"
        :style="buttonCssVars"
      />
      <Button
        :class="{ activeNewCard: isAddNewCardSelected }"
        @click="selectAddAccount()"
      >
        <PlusCircleIcon />
      </Button>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import AccountCard from './AccountCard.vue';
import ButtonPlain from './ButtonPlain.vue';
import { getAddressColor } from '../../utils/avatar';
import PlusCircleIcon from '../../../icons/plus-circle-fill.svg?vue-component';

export default {
  components: { AccountCard, ButtonPlain, PlusCircleIcon },
  props: { notification: Boolean },
  data() {
    return {
      isAddNewCardSelected: false,
    };
  },
  computed: {
    ...mapState('accounts', ['activeIdx']),
    ...mapGetters(['accounts']),
    cssVars() {
      return {
        '--activeIdx': this.selectedCardNumber,
        '--nextAccountIdx': this.filteredAccounts.length,
      };
    },
    filteredAccounts() {
      return this.accounts.map((a, index) => ({ ...a, i: index })).filter((a) => a.showed);
    },
    selectedCardNumber() {
      return this.filteredAccounts.findIndex((a) => a.i === this.activeIdx);
    },
    color() {
      return getAddressColor(this.accounts[this.activeIdx].address);
    },
    buttonCssVars() {
      return {
        '--activeColor': this.color,
      };
    },
  },
  methods: {
    async selectAccount(idx) {
      this.isAddNewCardSelected = false;
      await this.$watchUntilTruly(() => this.$store.state.middleware);
      this.$store.commit('accounts/setActiveIdx', idx);
    },
    async selectAddAccount() {
      this.isAddNewCardSelected = true;
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';

.account-switcher {
  display: flex;
  flex-direction: column;
  border-radius: 0 0 10px 10px;
  padding-top: 12px;
  z-index: 1;

  &.notification-above {
    margin-top: 16px;
  }

  .cards-wrapper {
    display: flex;
    width: calc(var(--nextAccountIdx) * (328px + 4px) + 16px + 16px - 4px);
    align-self: center;
    transition: margin-left 0.5s ease-out;
    margin-left: calc(var(--activeIdx) * (-328px - 4px));

    .account-card {
      margin-right: 4px;

      &:first-of-type {
        margin-left: 16px;
      }

      &:last-of-type {
        margin-right: 16px;
      }
    }

    &.menu-under {
      align-self: flex-start;
      margin-bottom: 12px;
    }
  }

  .buttons {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding-bottom: 12px;
    margin-left: 28px;
    max-width: 50%;;

    .button-plain {
        background-color: #434343;

      &:hover:not(.selected) {
        border-color: variables.$color-border-hover;
      }

      &:last-of-type {
        margin-right: 0;
      }

      &.selected {
        cursor: default;
        background-color: var(--activeColor);
      }
    }

    .activeNewCard {
      path {
        fill: variables.$color-add-account !important;
      }
    }

    .lastButton {
      width:3% !important;
    }
  }
}
</style>
