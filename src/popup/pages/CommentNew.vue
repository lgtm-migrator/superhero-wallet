<template>
  <div class="comment-new">
    <div class="tip-note-preview">
      {{ text }}
    </div>

    <BtnMain
      :disabled="!tippingSupported"
      @click="sendComment"
    >
      {{ $t('pages.tipPage.confirm') }}
    </BtnMain>
    <BtnMain @click="openCallbackOrGoHome(false)">
      {{ $t('pages.tipPage.cancel') }}
    </BtnMain>

    <Loader v-if="loading" />
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  computed,
  ref,
  watch,
} from '@vue/composition-api';
import { watchUntilTruthy } from '../utils/helper';
import { useDeepLinkApi } from '../../composables/deeplink-api';
import BtnMain from '../components/buttons/BtnMain.vue';

export default defineComponent({
  name: 'CommentNew',
  components: { BtnMain },
  setup(props, { root }) {
    const { openCallbackOrGoHome } = useDeepLinkApi({ router: root.$router });
    const id = ref<number>(0);
    const parentId = ref<number | undefined>(undefined);
    const text = ref<string>('');
    const loading = ref<boolean>(false);
    const sdk = computed(() => root.$store.state.sdk);
    const tippingSupported = computed(() => root.$store.getters.tippingSupported);

    watch(
      () => root.$route,
      async ({ query }: any) => {
        loading.value = true;

        id.value = query.id ?? 0;
        parentId.value = query.parentId ? +query.parentId : undefined;
        text.value = query.text ?? '';

        if (!id.value || !text.value) {
          root.$router.push('/account');
          throw new Error('CommentNew: Invalid arguments');
        }
        await watchUntilTruthy(() => sdk.value);
        loading.value = false;
      },
    );

    const sendComment = async () => {
      loading.value = true;
      try {
        await root.$store.dispatch('sendTipComment', [
          id,
          text,
          await sdk.value.address(),
          parentId,
        ]);
        openCallbackOrGoHome(true);
      } catch (e: any) {
        root.$store.dispatch('modals/open', {
          name: 'default',
          title: root.$t('modals.transaction-failed.msg'),
          icon: 'critical',
        });
        e.payload = { id, parentId, text };
        throw e;
      } finally {
        loading.value = false;
      }
    };

    return {
      id,
      parentId,
      text,
      loading,
      tippingSupported,
      sendComment,
    };
  },
});
</script>
