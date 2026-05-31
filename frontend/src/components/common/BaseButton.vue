<template>
  <q-btn
    :color="color"
    :label="label"
    :loading="loading"
    :disable="disable"
    unelevated
    no-caps
    @click="$emit('click', $event)"
  >
    <slot />
  </q-btn>
</template>

<script>
export default {
  name: 'BaseButton',
  props: {
    label: String,
    color: {
      type: String,
      default: 'primary'
    },
    loading: Boolean,
    disable: Boolean
  },
  emits: ['click']
};
</script>
