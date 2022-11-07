import { ref } from '@vue/composition-api';
import VueRouter, { Route } from 'vue-router';

export interface UseDeepLinkApiOptions {
  router: VueRouter
}

export function useDeepLinkApi({ router }: UseDeepLinkApiOptions) {
  const route = ref<Route>(router.currentRoute);
  const callbackOrigin = ref<URL | null>(
    route.value.query['x-success']
      ? (new URL(route.value.query['x-success'] as string))
      : null,
  );

  const openCallbackOrGoHome = (
    isSuccess: boolean,
    templateParams: {[key: string]: string} = {},
  ) => {
    const callbackUrlTemplate = route.value.query[isSuccess ? 'x-success' : 'x-cancel'];
    if (!callbackUrlTemplate) {
      router.push('/account');
      return;
    }
    const callbackUrl = Object.entries(templateParams).reduce(
      (url, [key, value]) => String(url).replace(new RegExp(`{${key}}`, 'g'), encodeURIComponent(value)),
      route.value.query[isSuccess ? 'x-success' : 'x-cancel'],
    ) as string;
    router.push('/account');
    window.open(callbackUrl, '_self');
  };

  return {
    callbackOrigin,
    openCallbackOrGoHome,
  };
}
