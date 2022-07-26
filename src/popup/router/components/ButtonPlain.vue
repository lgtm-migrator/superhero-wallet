<template>
  <button
    class="button-plain"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<style lang="scss" scoped>
@use '../../../styles/variables';

.button-plain {
  padding: 0;
  cursor: pointer;
  width:8px;
  height:8px;
  border-radius: 50%;
  margin-right: 8px;
}
</style>
