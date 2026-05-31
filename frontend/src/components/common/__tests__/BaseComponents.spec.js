import { mount } from '@vue/test-utils';
import BaseButton from '../BaseButton.vue';
import BaseInput from '../BaseInput.vue';

describe('BaseButton component', () => {
  it('renders label prop correctly', () => {
    const wrapper = mount(BaseButton, {
      props: {
        label: 'Click Me'
      },
      global: {
        stubs: {
          'q-btn': {
            template: '<button>{{ label }}</button>',
            props: ['label']
          }
        }
      }
    });
    expect(wrapper.text()).toBe('Click Me');
  });

  it('emits click event on click', async () => {
    const wrapper = mount(BaseButton, {
      props: {
        label: 'Click Me'
      },
      global: {
        stubs: {
          'q-btn': {
            template: '<button @click="$emit(\'click\')"><slot /></button>'
          }
        }
      }
    });
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted().click).toBeTruthy();
  });
});

describe('BaseInput component', () => {
  it('updates modelValue on input update', async () => {
    const wrapper = mount(BaseInput, {
      props: {
        modelValue: 'hello',
        label: 'Name'
      },
      global: {
        stubs: {
          'q-input': {
            template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
            props: ['modelValue']
          }
        }
      }
    });
    const input = wrapper.find('input');
    expect(input.element.value).toBe('hello');
    await input.setValue('world');
    expect(wrapper.emitted()['update:modelValue'][0]).toEqual(['world']);
  });
});
