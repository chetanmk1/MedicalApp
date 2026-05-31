<template>
  <q-input
    :model-value="modelValue"
    outlined
    dense
    :label="label"
    :type="type"
    :rules="rules"
    lazy-rules
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <slot />
    <template v-if="$slots.prepend" v-slot:prepend>
      <slot name="prepend" />
    </template>
    <template v-if="$slots.append" v-slot:append>
      <slot name="append" />
    </template>
  </q-input>
</template>

<script>
export default {
  name: 'BaseInput',
  props: {
    modelValue: [String, Number],
    label: String,
    type: {
      type: String,
      default: 'text'
    },
    rules: Array
  },
  emits: ['update:modelValue']
};
</script>
