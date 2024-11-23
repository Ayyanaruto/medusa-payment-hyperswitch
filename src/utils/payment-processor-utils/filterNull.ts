export const filterNull = (value: Object) => {
  for (let key in value) {
    if (value[key] === null) {
      delete value[key];
    } else if (typeof value[key] === "object" && !Array.isArray(value[key])) {
      filterNull(value[key]);
    }
  }
  return value;
};
