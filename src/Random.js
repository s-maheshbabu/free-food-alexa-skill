/**
 * Helper method to find if a request is an IntentRequest of the specified intent.
 */
const random = () => {
    if (process.env.EXEC_ENV && process.env.EXEC_ENV === 'DEVO')
        return mockRandom()();

    return Math.random();
}

let index = 0;
const mockRandom = () => {
    let arrayOfValues = [0.81, 0.17, 0.62, 0.19, 0.44, 0.07, 0.69, 0.21, 0.39, 0.71, 0.49, 0.54, 0.98];

    return () => {
        if (arrayOfValues.length === 0) {
            throw new TypeError('The value list must contain some value');
        }
        if (index >= arrayOfValues.length) {
            index = 0;
        }
        return arrayOfValues[index++];
    };
};

const resetMockRandom = () => { index = 0 };

module.exports = {
    random: random,
    resetMockRandom: resetMockRandom,
};