export const filterNull = (value:Object) => {
    for (let key in value) {
        if (value[key] === null) {
            delete value[key];
        }
    }
    return value;
}