const interactions = require("interactions");
const util = require("util");

module.exports = LocalizationInterceptor = {
  process(handlerInput) {
    console.log(
      util.inspect(handlerInput.requestEnvelope.request, {
        showHidden: true,
        depth: null
      })
    );
    interactions.init(handlerInput.requestEnvelope.request.locale);
  }
};
