<template>
  <div class="name-item">
    <div class="collapsed">
      <Pending
        v-if="nameEntry.pending"
        class="pending-icon"
      />
      <Avatar
        v-else
        :name="name"
        :address="address"
      />
      <div class="header">
        <Truncate :str="name" />
        <span
          v-if="nameEntry.pending"
          class="pending"
        >
          {{ $t('pages.transactions.pending') }}
        </span>
        <div
          v-if="!nameEntry.pending"
          class="buttons"
        >
          <button
            v-show="hasPointer"
            :class="{ set: account.name === name }"
            :disabled="account.name === name"
            @click="setDefault"
          >
            {{
              account.name === name
                ? $t('pages.names.list.default-name')
                : $t('pages.names.list.default-make')
            }}
          </button>
          <button
            v-show="expand"
            :class="{ set: autoExtend }"
            @click="setAutoExtend"
          >
            {{ $t('pages.names.auto-extend') }}
          </button>
          <button
            v-show="expand || !hasPointer"
            :class="{ edit: showInput }"
            @click="expandAndShowInput"
          >
            {{ $t('pages.names.details.set-pointer') }}
          </button>
        </div>
      </div>
      <BtnPlain @click="expand = !expand">
        <Arrow :class="['icon', { rotated: expand, hidden: nameEntry.pending }]" />
      </BtnPlain>
    </div>
    <span v-show="!expand && !nameEntry.pending && !!addressOrFirstPointer">
      {{ addressOrFirstPointer }}
    </span>
    <div
      v-show="expand"
      class="expand"
    >
      <InputField
        v-show="showInput"
        v-model="newPointer"
        class="input-address"
        :placeholder="$t('pages.names.details.address-placeholder')"
        :message="error ? $t('pages.names.list.valid-identifier-error') : null"
        code
      >
        <template #after>
          <BtnPlain
            v-show="newPointer.length"
            @click="setPointer"
          >
            <Save class="input-address-icon" />
          </BtnPlain>
          <BtnPlain
            v-if="UNFINISHED_FEATURES"
            v-show="!newPointer.length"
            @click="insertValueFromClipboard"
          >
            <Paste class="input-address-icon" />
          </BtnPlain>
        </template>
      </InputField>

      <DetailsItem
        :value="nameEntry.hash"
        :label="nameEntry.hash && $t('pages.names.list.name-hash')"
      />
      <div class="heights">
        <DetailsItem
          :value="nameEntry.createdAtHeight"
          :label="$t('pages.names.details.created-height')"
        />
        <DetailsItem
          :value="nameEntry.expiresAt"
          :label="$t('pages.names.details.expires-height')"
          :secondary="`(≈${blocksToRelativeTime(nameEntry.expiresAt - topBlockHeight)})`"
        />
      </div>
      <DetailsItem
        v-if="Object.entries(nameEntry.pointers || {}).length"
        :label="$t('pages.names.list.pointers')"
      >
        <template #label>
          <BtnHelp
            :title="$t('modals.name-pointers-help.title')"
            :msg="$t('modals.name-pointers-help.msg')"
          />
        </template>
        <template #value>
          <div
            v-for="(nameEntryPointer, key, idx) in nameEntry.pointers"
            :key="key"
            class="pointers"
          >
            <span>{{ `#${idx + 1}` }}</span>
            {{ nameEntryPointer }}
          </div>
        </template>
      </DetailsItem>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { pick } from 'lodash-es';
import {
  blocksToRelativeTime,
  checkAddressOrChannel,
  readValueFromClipboard,
} from '../utils';
import Pending from '../../icons/animated-pending.svg?vue-component';
import Avatar from './Avatar.vue';
import Truncate from './Truncate.vue';
import InputField from './InputField.vue';
import BtnPlain from './buttons/BtnPlain.vue';
import BtnHelp from './buttons/BtnHelp.vue';
import DetailsItem from './DetailsItem.vue';
import Arrow from '../../icons/arrow.svg?vue-component';
import Save from '../../icons/account-card/btn-save.svg?vue-component';
import Paste from '../../icons/paste.svg?vue-component';

export default {
  components: {
    Pending,
    Avatar,
    Truncate,
    InputField,
    BtnPlain,
    BtnHelp,
    DetailsItem,
    Arrow,
    Save,
    Paste,
  },
  props: {
    name: { type: String, default: '' },
    address: { type: String, default: '' },
    autoExtend: { type: Boolean },
  },
  data: () => ({
    expand: false,
    newPointer: '',
    showInput: false,
    error: false,
    UNFINISHED_FEATURES: process.env.UNFINISHED_FEATURES,
  }),
  subscriptions() {
    return pick(this.$store.state.observables, ['topBlockHeight']);
  },
  computed: {
    ...mapGetters(['account']),
    nameEntry() {
      return this.$store.getters['names/get'](this.name);
    },
    hasPointer() {
      return this.nameEntry?.pointers?.accountPubkey;
    },
    addressOrFirstPointer() {
      return this.nameEntry?.pointers?.accountPubkey
        || Object.values(this.nameEntry?.pointers || {})[0];
    },
  },
  watch: {
    newPointer() {
      this.error = false;
    },
  },
  methods: {
    blocksToRelativeTime,
    checkAddressOrChannel,
    async insertValueFromClipboard() {
      this.newPointer = await readValueFromClipboard();
    },
    async setDefault() {
      await this.$store.dispatch('names/setDefault', {
        address: this.account.address,
        name: this.name,
      });
    },
    async setAutoExtend() {
      if (!this.autoExtend) {
        await this.$store.dispatch('modals/open', {
          name: 'confirm',
          icon: 'info',
          title: this.$t('modals.autoextend-help.title'),
          msg: this.$t('modals.autoextend-help.msg'),
        });
      }
      this.$store.commit('names/setAutoExtend', { name: this.name, value: !this.autoExtend });
    },
    expandAndShowInput() {
      this.expand = true;
      this.showInput = !this.showInput;
    },
    async setPointer() {
      if (!checkAddressOrChannel(this.newPointer)) {
        this.error = true;
        return;
      }
      this.$store.dispatch('names/updatePointer', {
        name: this.name,
        address: this.newPointer,
        type: 'update',
      });
      this.newPointer = '';
      this.showInput = false;
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.name-item {
  display: flex;
  flex-direction: column;
  padding: 8px var(--screen-padding-x);
  margin-left: calc(-1 * var(--screen-padding-x));
  margin-right: calc(-1 * var(--screen-padding-x));
  transition: 0.2s;

  &:hover {
    background-color: variables.$color-bg-4-hover;
  }

  .collapsed {
    display: flex;
    text-align: left;
    justify-content: space-between;

    .pending-icon {
      height: 32px;
      width: 32px;
    }

    .header {
      flex: 2;
      max-width: 260px;

      .pending {
        color: variables.$color-grey-dark;

        @extend %face-sans-12-regular;
      }

      .truncate {
        @extend %face-sans-14-bold;

        line-height: 16px;
      }

      .buttons {
        margin-top: 2px;

        button {
          padding: 2px 8px;
          cursor: pointer;
          background: variables.$color-border-hover;
          border-radius: 6px;

          @extend %face-sans-12-medium;

          &.set {
            background: rgba(variables.$color-warning, 0.1);
            color: variables.$color-warning;
          }

          &.edit {
            background: rgba(variables.$color-primary, 0.15);
            color: variables.$color-primary;
          }

          &:not(:last-of-type) {
            margin-right: 4px;
          }
        }
      }
    }

    .button-plain {
      align-self: flex-start;
      flex-basis: 24px;

      .icon {
        width: 14px;
        color: variables.$color-white;
        opacity: 0.44;

        &.hidden {
          display: none;
        }

        &.rotated {
          transform: rotate(180deg);
        }
      }
    }
  }

  .expand {
    display: flex;
    flex-direction: column;

    .input-address {
      margin: 8px 0;

      &-icon {
        width: 24px;
        height: 24px;
        margin: -4px 0;
      }
    }

    .details-item ::v-deep .value {
      color: variables.$color-grey-light;
    }

    > .details-item {
      margin: 8px 0;

      ::v-deep .value {
        @extend %face-mono-10-medium;

        letter-spacing: 0;

        .pointers {
          display: flex;

          span {
            margin-right: 4px;
            color: variables.$color-grey-dark;

            @extend %face-sans-12-medium;
          }
        }
      }
    }

    .heights {
      display: flex;
      flex-direction: row;

      .details-item {
        flex: 1;

        ::v-deep .value .secondary {
          color: variables.$color-grey-dark;
          margin-left: -2px;
        }

        &:first-of-type {
          margin-right: 16px;
        }
      }
    }
  }

  > span {
    margin-top: 4px;
    color: variables.$color-grey-light;

    @extend %face-mono-10-medium;
  }
}
</style>
