<template>
  <Default
    :icon="icon || 'info'"
    v-bind="$attrs"
  >
    <template #msg>
      <TemplateRenderer
        :str="msg"
        :option="option"
      />
    </template>
  </Default>
</template>

<script>
import Default from './Default.vue';
import TemplateRenderer from '../TemplateRenderer.vue';

export default {
  components: {
    Default,
    TemplateRenderer,
  },
  props: {
    msg: { type: String, default: '' },
    option: { type: Object, default: null },
    icon: { type: String, default: null },
  },
};
</script>
