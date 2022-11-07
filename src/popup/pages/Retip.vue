<template>
  <div class="retip">
    <BalanceInfo />
    <div class="section-title">
      {{ $t('pages.tipPage.url') }}
    </div>

    <div v-if="urlStatus" class="url-bar">
      <UrlStatus :status="urlStatus" />
      <a>{{ tip.url }}</a>
    </div>

    <InputAmount
      v-model="formModel.amount"
      v-validate="{
        required: true,
        min_value_exclusive: 0,
        ...+balance.minus(fee) > 0 ? { max_value: max } : {},
        enough_ae: fee.toString(),
      }"
      name="amount"
      class="amount-input"
      show-tokens-with-balance
      :message="validationStatus.msg || errors.first('amount')"
      :selected-asset="formModel.selectedAsset"
      @asset-selected="handleAssetChange"
    />
    <div
      v-if="tip.title"
      class="tip-note-preview"
    >
      {{ tip.title }}
    </div>

    <BtnMain
      class="bottom-btn"
      extend
      :disabled="!tippingSupported || validationStatus.error || $validator.errors.has('amount')"
      @click="sendTip"
    >
      {{ $t('pages.tipPage.confirm') }}
    </BtnMain>
    <BtnMain
      class="bottom-btn"
      extend
      @click="openCallbackOrGoHome(false)"
    >
      {{ $t('pages.tipPage.cancel') }}
    </BtnMain>

    <Loader v-if="loading" />
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  ref,
  watch,
  computed,
  Ref,
} from '@vue/composition-api';
import { SCHEMA } from '@aeternity/aepp-sdk';
import { MAGNITUDE, AETERNITY_CONTRACT_ID } from '../utils/constants';
import { convertToken, watchUntilTruthy, rxJsObservableToVueState } from '../utils';
import { useMaxAmount } from '../../composables/maxAmount';
import { useDeepLinkApi } from '../../composables/deeplink-api';
import InputAmount from '../components/InputAmountV2.vue';
import UrlStatus from '../components/UrlStatus.vue';
import BtnMain from '../components/buttons/BtnMain.vue';
import BalanceInfo from '../components/BalanceInfo.vue';

export default defineComponent({
  name: 'Retip',
  components: {
    InputAmount, UrlStatus, BtnMain, BalanceInfo,
  },
  setup(props, { root }) {
    const { openCallbackOrGoHome } = useDeepLinkApi({ router: root.$router });

    const tip = ref<any>({
      url: 'default',
    });
    const formModel = ref<any>({
      amount: null,
      selectedAsset: null,
    });
    const {
      max,
      fee,
      balance,
      account,
    } = useMaxAmount({
      formModel,
      store: root.$store,
    });
    const balanceCurrency = rxJsObservableToVueState(
      root.$store.state.observables.balanceCurrency,
    ) as Ref<any>;

    const loading = ref<boolean>(false);
    const getAeternityToken = computed(() => root.$store.getters['fungibleTokens/getAeternityToken']);
    const tippingV1 = computed(() => root.$store.state.tippingV1);
    const tippingV2 = computed(() => root.$store.state.tippingV2);
    const tippingSupported = computed(() => root.$store.getters.tippingSupported);
    const urlStatus = computed(() => root.$store.getters['tipUrl/status'][tip.value.url]);
    const tippingContract = computed(
      () => root.$route.query.id.includes('_v2') || root.$route.query.id.includes('_v3')
        ? tippingV2.value
        : tippingV1.value,
    );
    const validationStatus = computed(() => {
      const { sdk } = root.$store.state;
      const { minTipAmount } = root.$store.getters;
      if (!sdk || !tippingContract.value) {
        return { error: true };
      }
      if (formModel.value.selectedAsset?.contractId !== AETERNITY_CONTRACT_ID
        && root.$route.query.id.includes('_v1')) {
        return { error: true, msg: root.$t('pages.tipPage.v1FungibleTokenTipError') };
      }
      if (formModel.value.selectedAsset?.contractId === AETERNITY_CONTRACT_ID
        && +formModel.value.amount < minTipAmount) {
        return { error: true, msg: root.$t('pages.tipPage.minAmountError') };
      }
      return { error: false };
    });
    const sendTip = async () => {
      const amount = convertToken(
        formModel.value.amount,
        formModel.value.selectedAsset.contractId !== AETERNITY_CONTRACT_ID
          ? formModel.value.selectedAsset.decimals : MAGNITUDE,
      ).toFixed();
      loading.value = true;
      await watchUntilTruthy(() => tippingV1.value);
      try {
        let retipResponse = null;
        if (formModel.value.selectedAsset.contractId !== AETERNITY_CONTRACT_ID) {
          await root.$store.dispatch('fungibleTokens/createOrChangeAllowance',
            [formModel.value.selectedAsset.contractId, formModel.value.amount]);
          retipResponse = await tippingV2.value.methods.retip_token(
            +tip.value.id.split('_')[0],
            formModel.value.selectedAsset.contractId,
            amount,
            {
              waitMined: false,
            },
          );
        } else {
          retipResponse = await tippingContract.value.methods.retip(+tip.value.id.split('_')[0], {
            amount,
            waitMined: false,
          });
        }
        root.$store.dispatch('addPendingTransaction', {
          hash: retipResponse.hash,
          amount,
          tipUrl: tip.value.url,
          tx: {
            callerId: account.value.address,
            contractId: tippingContract.value.deployInfo.address,
            type: SCHEMA.TX_TYPE.contractCall,
            function: 'retip',
            selectedTokenId: formModel.value.selectedAsset?.contractId,
          },
        });
        openCallbackOrGoHome(true);
      } catch (e:any) {
        root.$store.dispatch('modals/open', {
          name: 'default',
          title: root.$t('modals.transaction-failed.msg'),
          icon: 'critical',
        });
        e.payload = tip.value;
        throw e;
      } finally {
        loading.value = false;
      }
    };

    const handleAssetChange = (selectedAsset: any) => {
      formModel.value.selectedAsset = selectedAsset;
    };

    onMounted(async () => {
      loading.value = true;
      formModel.value.selectedAsset = getAeternityToken.value({
        tokenBalance: balance.value,
        balanceCurrency: balanceCurrency.value,
      });
      const tipId = root.$route.query.id;
      if (!tipId) throw new Error('"id" param is missed');
      try {
        tip.value = await root.$store.dispatch('getCacheTip', tipId);
      } catch (error) {
        //
      }
      loading.value = false;
    });
    return {
      handleAssetChange,
      tip,
      formModel,
      loading,
      urlStatus,
      validationStatus,
      tippingSupported,
      sendTip,
      max,
      fee,
      balance,
      openCallbackOrGoHome,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.retip {
  padding: 16px;

  .url-bar {
    display: flex;
    align-items: center;

    svg {
      width: 24px;
      height: 24px;
    }

    > a {
      overflow-wrap: anywhere;
      text-align: left;
      color: variables.$color-white;
      flex-grow: 1;
      text-decoration: none;
      width: 90%;
      margin: 8px 0 8px 10px;

      @extend %face-sans-11-regular;
    }
  }

  .input-field + .button {
    margin-top: 50px;
  }

  .section-title {
    margin-bottom: 8px;
    margin-top: 16px;
    color: variables.$color-white;
    text-align: left;

    @extend %face-sans-16-regular;
  }

  .bottom-btn {
    max-width: 280px;
    margin: 10px auto 0;
  }
}
</style>
