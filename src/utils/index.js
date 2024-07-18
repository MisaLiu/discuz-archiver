
export const fillNumber = (number, length) => {
  let result = number + '';
  while (result.length < length) {
    result = '0' + result;
  }
  return result;
}
