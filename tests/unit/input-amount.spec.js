import Vue from 'vue';
import Vuex from 'vuex';
import BigNumber from 'bignumber.js';
import { mount } from '@vue/test-utils';
import VueCompositionApi from '@vue/composition-api';
import InputAmount from '../../src/popup/components/InputAmount.vue';
import veeValidate from '../../src/store/plugins/veeValidate';

Vue.use(VueCompositionApi);

Object.assign(Vue.prototype, {
  $t: () => 'locale-specific-text',
});

Vue.use(Vuex);

const maxBalance = 10000;

const store = new Vuex.Store({
  plugins: [veeValidate],
  getters: {
    currentCurrencyRate: () => 3,
    formatCurrency: () => (value) => (+value).toFixed(2),
  },
});

describe('InputAmount', () => {
  [{
    name: 'input empty',
    error: true,
    value: '',
    displayed: '',
    currency: 0,
  },
  {
    name: 'input zero',
    error: true,
    value: 0,
    displayed: 0,
    currency: 0,
  },
  {
    name: 'input int',
    value: 1,
    displayed: 1,
    currency: 3,
  },
  {
    name: 'input float',
    value: 0.1234567890,
    displayed: 0.1234567890,
    currency: 0.37,
  },
  {
    name: 'input in exponential notation',
    value: '1e2',
    displayed: '1e2',
    currency: 300,
  },
  {
    name: 'input negative int',
    error: true,
    value: -1,
    displayed: -1,
    currency: -3,
  },
  {
    name: 'input more than balance',
    error: true,
    value: maxBalance + 1,
    displayed: maxBalance + 1,
    currency: (maxBalance + 1) * 3,
  },
  {
    name: 'input with validation property set',
    error: true,
    value: 1,
    displayed: 1,
    currency: 3,
    props: { validation: { min_value_exclusive: 2 } },
  },
  {
    name: 'input with validation and ownValidation properties set',
    value: 2,
    displayed: 2,
    currency: 6,
    props: { validation: { min_value_exclusive: 0 }, ownValidation: true },
    balance: 1,
  }].forEach((test) => it(test.name, async () => {
    const wrapper = mount(InputAmount, {
      computed: {
        max() { return test.balance || maxBalance; },
      },
      store,
      attrs: { value: test.value },
      propsData: { ...test.props },
      data: () => ({ balance: BigNumber(test.balance || maxBalance) }),
    });

    store._vm.$validator.extend('enough_ae', (_, [arg]) => BigNumber(test.balance || maxBalance).isGreaterThanOrEqualTo(arg));
    expect(wrapper.find('input').element.value).toBe(test.displayed.toString());
    expect(wrapper.find('.token').text()).toBe('AE');
    expect(wrapper.find('[data-cy=amount-currency]').text()).toBe(`(${test.currency.toFixed(2)})`);

    /* await store._vm.$validator.validateAll(); TODO: be able to test errors
    if (test.error) {
      expect(wrapper.find('.message.error').exists()).toBeTruthy();
    } */
  }));
});
