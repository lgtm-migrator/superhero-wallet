<template>
  <div :class="['account-info', { edit }]">
    <div class="title">
      <Avatar
        class="avatar"
        :address="accounts[idx].address"
        :name="accounts[idx].name"
        :color="color"
      />
      <div
        class="account-details"
      >
        <div v-if="!copied">
          <router-link
            :to="{ name: 'name-claim' }"
            class="account-name"
          >
            <span v-if="accounts[idx].name">
              <Truncate :str="accounts[idx].name" />
            </span>
            <span v-else>
              {{ $t('pages.account.heading') }} {{ accountIdx + 1 }}
            </span>
          </router-link>
          <a
            class="ae-address"
            @click="copy"
          >
            {{ truncateAdrress(accounts[idx].address) }}
          </a>
        </div>
        <div
          v-else
          class="copied"
        >
          <CheckedCircleIcon />
          <span class="text">{{ $t('addressCopied') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex';
import CopyMixin from '../../../mixins/copy';
import Avatar from './Avatar.vue';
import CheckedCircleIcon from '../../../icons/account-card/checked-circle.svg?vue-component';
import Truncate from './Truncate.vue';

export default {
  components: {
    Avatar,
    CheckedCircleIcon,
    Truncate,
  },
  mixins: [CopyMixin],
  props: {
    accountIdx: { type: Number, default: -1 },
    color: { type: String, required: true },
  },
  data: () => ({
    edit: false,
    customAccountName: '',
    maxCustomNameLength: 22,
    UNFINISHED_FEATURES: process.env.UNFINISHED_FEATURES,
  }),
  computed: {
    ...mapState('accounts', ['activeIdx']),
    ...mapState(['cardMinified']),
    ...mapGetters(['accounts', 'activeNetwork']),
    idx() {
      return this.accountIdx === -1 ? this.activeIdx : this.accountIdx;
    },
    explorerUrl() {
      const { address } = this.accounts[this.idx];
      return `${this.activeNetwork.explorerUrl}/account/transactions/${address}`;
    },
  },
  mounted() {
    this.customAccountName = this.accounts[this.idx].localName;
  },
  methods: {
    ...mapActions({ createAccount: 'accounts/hdWallet/create' }),
    saveLocalName() {
      this.$store.commit('accounts/setLocalName', { name: this.customAccountName, idx: this.idx });
      this.edit = false;
    },
    async remove() {
      await this.$store.dispatch('modals/open', {
        name: 'confirm',
        icon: 'critical',
        title: this.$t('modals.removeSubaccount.title'),
        msg: this.$t('modals.removeSubaccount.msg'),
      });
      this.$store.commit('accounts/remove', this.idx);
    },
    truncateAdrress() {
      const addressFields = this.accounts[this.idx].address.match(/.{3}/g);
      return `${addressFields.slice(0, 3).reduce((acc, current) => `${acc} ${current}`)} ···
      ${addressFields.slice(-3).reduce((acc, current) => `${acc} ${current}`)}`;
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.account-info {
  padding: 12px 12px 5px 12px;
  text-align: left;
  margin-bottom: 4px;

  .title {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 8px;
    margin-bottom: 6px;

    line-height: 16px;

    .avatar {
      align-self: flex-start;
      margin-right: 8px;
      overflow: visible;
      width: 48px;
      height: 48px;
      background-color: variables.$color-black;
    }

    .input-field ::v-deep .main-wrapper button {
      background-color: transparent;
    }

    .account-details {
      display: flex;
      flex-wrap: nowrap;
      justify-content: center;
      flex-direction: column;
      width:203px;
      height: 48px;

      .account-name {
        @extend %face-sans-16-600;
        flex: 1;
        font-weight: 600;
        font-size: 16px;
        color: variables.$color-white;
        text-decoration: none;
      }
      .ae-address {
        @extend %face-mono-14-medium;
        color: variables.$color-white;
        display: flex;
        opacity: 0.85;
        width: 130%;
        margin-top: 8px;
        text-decoration: none;

        &:hover {
          color: variables.$color-white;
          opacity: 1;
          text-decoration: underline;
        }
      }

      .copied {
        align-items: center;
        justify-content: center;
        display: flex;
        flex: 0.9;
        border: dashed 1.1px #FFF;
        border-radius: 5px;

        svg {
          margin-right: 6px;
        }

        .text {
          @extend %face-sans-16-medium;
          white-space: nowrap;
        }
      }
    }
  }
}
</style>
