import Vue from 'vue';
import { shallowMount } from '@vue/test-utils';
import VueCompositionApi from '@vue/composition-api';
import BtnMain from '../../src/popup/components/buttons/BtnMain.vue';

Vue.use(VueCompositionApi);

describe('Button.vue', () => {
  it('adds prop.fill class', () => {
    const fill = 'primary';
    const wrapper = shallowMount(BtnMain, {
      propsData: { fill },
    });
    expect(wrapper.find(`.${fill}`).exists()).toBeTruthy();
  });
});
