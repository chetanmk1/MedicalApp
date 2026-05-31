export const useFormValidation = () => {
  const isValidEmail = (val) => {
    const pattern = /^(?=[A-Za-z0-9@._%+-]{6,254}$)[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/;
    return pattern.test(val);
  };

  const isRequired = (val) => {
    return !!val || 'Field is required';
  };

  const minLength = (min) => (val) => {
    return (val && val.length >= min) || `Must be at least ${min} characters`;
  };

  return {
    isValidEmail,
    isRequired,
    minLength,
  };
};
