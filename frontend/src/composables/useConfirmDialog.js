import { useQuasar } from 'quasar';

export const useConfirmDialog = () => {
  const $q = useQuasar();

  const confirm = ({ title = 'Confirm', message = 'Are you sure?', okLabel = 'Confirm', cancelLabel = 'Cancel', color = 'primary', html = false }) => {
    return new Promise((resolve) => {
      $q.dialog({
        title,
        message,
        html,
        ok: {
          label: okLabel,
          color,
          unelevated: true
        },
        cancel: {
          label: cancelLabel,
          color: 'grey-7',
          flat: true
        },
        persistent: true
      }).onOk(() => {
        resolve(true);
      }).onCancel(() => {
        resolve(false);
      }).onDismiss(() => {
        resolve(false);
      });
    });
  };

  return { confirm };
};
