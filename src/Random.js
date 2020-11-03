/**
 * In non-'DEVO' environments, delegates to Math.random.
 * In 'DEVO' environments, returns a deterministic cyclic list
 * of values. 
 */
const random = () => {
    if (process.env.EXEC_ENV && process.env.EXEC_ENV === 'DEVO')
        return mockRandom()();

    return Math.random();
}

let index = 0;
/**
 * Returns a deterministic cyclic list of values. This method is meant for making unit tests run predictably
 * and should not be used in a production environment. The list of values returned is baked into the method.
 */
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

/**
 * Reset the cyclic list of mock random values to start from the beginning.
 */
const resetMockRandom = () => { index = 0 };

module.exports = {
    random: random,
    resetMockRandom: resetMockRandom,
};