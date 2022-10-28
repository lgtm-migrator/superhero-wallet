<template>
  <div class="scrollable">
    <div
      class="scrollable-inner"
      :class="{'hide-scrollbar': hideScrollbar}"
    >
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  props: {
    hideScrollbar: Boolean,
  },
};
</script>

<style lang="scss" scoped>
@use '../../styles/variables';

.scrollable {
  position: relative;
  width: 100%;
  height: 100%;
  max-height: 100%;

  &-inner {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow-y: scroll;
    scrollbar-width: auto;
    -ms-overflow-style: auto;

    &::-webkit-scrollbar {
      display: block;
      width: 6px;
      height: 0;

      &-thumb {
        display: block;
        background-color: rgba(variables.$color-white, 0.15);
        border-radius: 4px;
      }
    }

    &.hide-scrollbar {
      scrollbar-width: none;

      &::-webkit-scrollbar {
        display: none;
      }
    }
  }
}
</style>
