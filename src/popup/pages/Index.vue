<template>
  <div
    class="index"
  >
    <img
      v-if="IN_FRAME"
      src="../../icons/iframe/sendAndReceive.svg"
    >
    <div
      v-else
      class="not-iframe"
    >
      <Logo />
      <div class="heading">
        <i18n
          path="pages.index.heading.message"
          tag="span"
          class="tag"
        >
          <span class="receive">{{ $t('pages.index.heading.receive') }}</span>
          <span class="store">{{ $t('pages.index.heading.store') }}</span>
          <span class="send">{{ $t('pages.index.heading.send') }}</span>
          <span class="aeternity-name">{{ $t('pages.index.heading.aeternityBlockchain') }}</span>
        </i18n>
      </div>

      <template v-if="IS_WEB">
        <Platforms :class="{ agreed: termsAgreed }">
          <template #header>
            {{ $t('pages.index.platforms.heading') }}
          </template>
          <template #footer>
            {{ $t('pages.index.webVersion') }}
          </template>
        </Platforms>
      </template>
    </div>

    <div :class="['terms-agreement', { mobile: !IS_WEB }]">
      <CheckBox
        v-model="termsAgreed"
        :class="{ agreed: termsAgreed }"
        data-cy="checkbox"
      >
        <span>
          {{ $t('pages.index.term1') }}
        </span>
      </CheckBox>
      <RouterLink
        :to="{ name: 'about-terms' }"
        data-cy="terms"
        :class="{ agreed: termsAgreed }"
        class="terms-of-use"
      >
        {{ $t('pages.index.termsAndConditions') }}
      </RouterLink>
    </div>
    <div
      class="wallet-button-box"
    >
      <BtnSubheader
        v-show="termsAgreed"
        data-cy="generate-wallet"
        :subheader="$t('pages.index.getStartedWithWallet')"
        :header="$t('pages.index.generateWallet')"
        @click="createWallet"
      >
        <PlusCircleIcon />
      </BtnSubheader>
      <BtnSubheader
        v-show="termsAgreed"
        data-cy="import-wallet"
        :subheader="$t('pages.index.enterSeed')"
        :header="$t('pages.index.importWallet')"
        @click="importWallet"
      >
        <CheckCircleIcon />
      </BtnSubheader>
    </div>
  </div>
</template>

<script>
import { generateMnemonic } from '@aeternity/bip39';
import { IS_WEB, IN_FRAME } from '../../lib/environment';
import CheckBox from '../components/CheckBox.vue';
import BtnSubheader from '../components/buttons/BtnSubheader.vue';
import Platforms from '../components/Platforms.vue';
import { MODAL_ACCOUNT_IMPORT } from '../utils/constants';
import Logo from '../../icons/logo.svg?vue-component';
import PlusCircleIcon from '../../icons/plus-circle-fill.svg?vue-component';
import CheckCircleIcon from '../../icons/check-circle-fill.svg?vue-component';

export default {
  components: {
    Logo,
    CheckBox,
    BtnSubheader,
    PlusCircleIcon,
    CheckCircleIcon,
    Platforms,
  },
  data: () => ({
    termsAgreed: false,
    IS_WEB,
    IN_FRAME,
  }),
  methods: {
    async createWallet() {
      this.$store.commit('setMnemonic', generateMnemonic());
      this.$router.push(this.$store.state.loginTargetLocation);
    },
    async importWallet() {
      await this.$store.dispatch('modals/open', {
        name: MODAL_ACCOUNT_IMPORT,
      });
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';
@use '../../styles/mixins';

.index {
  padding-top: 42px;
  padding-top: calc(42px + env(safe-area-inset-top));
  text-align: center;

  .terms-agreement {
    @include mixins.flex(center);

    @extend %face-sans-15-regular;

    margin-bottom: 4px;

    & > * {
      transition: all 0.12s ease-in-out;
    }

    .checkbox-container {
      margin-right: 4px;
      color: rgba(variables.$color-white, 0.5);

      &.agreed {
        color: variables.$color-white;
      }

      &:hover:not(.agreed),
      &:active:not(.agreed) {
        color: variables.$color-grey-dark;
      }

      ::v-deep .checkmark {
        margin-right: 10px;
        border-color: rgba(variables.$color-white, 0.3);
      }
    }

    .terms-of-use {
      color: rgba(variables.$color-white, 0.75);
      text-decoration: none;
      margin-bottom: 4px;

      &:hover {
        color: variables.$color-white;
        text-decoration: underline;
      }

      &.agreed {
        color: white;
      }
    }

    &.mobile {
      margin-top: 32px;
    }
  }

  .not-iframe {
    text-align: center;

    svg {
      height: 35px;
      margin-bottom: 8px;
    }

    .heading {
      @extend %face-sans-18-medium;

      @include mixins.flex(center);

      line-height: 125%;
      color: variables.$color-white;
      margin: 8px 60px 8px 60px;

      .tag {
        color: rgba(variables.$color-white, 0.75);

        .receive,
        .store,
        .send {
          color: variables.$color-white;
        }

        .aeternity-name {
          color: variables.$color-danger;
        }
      }
    }

    &.mobile {
      @extend %face-sans-20-regular;

      color: variables.$color-white;
      max-width: 80%;
      margin: 0 auto;
      min-height: 25vh;
      padding-top: 30px;
    }

    &.go {
      @extend %face-sans-20-bold;

      margin-top: -36px;
      margin-bottom: 42px;
    }

    .spinner {
      width: 256px;
      height: 256px;
      color: variables.$color-primary;
    }

    .platforms {
      border-radius: 6px;
      margin: 8px auto 0 auto;
      padding-top: 8px;
      max-width: 312px;

      &.agreed {
        opacity: 0.66;
      }
    }
  }

  .wallet-button-box {
    margin-left: 16px;
    margin-right: 16px;
  }
}
</style>
