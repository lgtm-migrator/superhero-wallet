<template>
  <input
    class="input-range"
    :value="value"
    v-bind="$attrs"
    type="range"
    @input="$emit($event.type, +$event.target.value)"
  >
</template>

<script>
export default {
  props: {
    value: { type: [String, Number], default: '' },
  },
};
</script>

<style lang="scss" scoped>
@use '../../styles/variables';

.input-range {
  -webkit-appearance: none;
  width: 100%;
  height: 25px;
  cursor: pointer;
  background: transparent;
  filter: brightness(85%);
  overflow: hidden;

  $colors: (
    track-color: variables.$color-grey-dark,
    progress-color: variables.$color-success,
    thumb-color: variables.$color-success,
  );

  @mixin range-track($background-color) {
    width: 100%;
    height: 8px;
    border-radius: 4px;
    background: $background-color;
  }

  @each $name in (-webkit-slider-runnable-track, -moz-range-track, -ms-track, -ms-fill-upper) {
    &::#{$name} {
      @include range-track(map-get($colors, track-color));
    }
  }

  @each $name in -moz-range-progress -ms-fill-lower {
    &::#{$name} {
      @include range-track(map-get($colors, progress-color));
    }
  }

  @each $name in -webkit-slider-thumb -moz-range-thumb -ms-thumb {
    &::#{$name} {
      height: 12px;
      width: 12px;
      border: 4px solid map-get($colors, track-color);
      border-radius: 48px;
      background: map-get($colors, thumb-color);
      box-shadow: 0 0 8px variables.$color-black;
      cursor: pointer;
    }
  }

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 20px;
    width: 20px;
    margin-top: -6px;
  }

  &:focus {
    outline: none;
    border: none;
  }

  &:hover {
    filter: brightness(100%);
  }

  &::-ms-track {
    background: transparent;
    border-color: transparent;
    color: transparent;
  }
}
</style>
