const interactions = require("../interactions");

module.exports = LocalizationInterceptor = {
  process(handlerInput) {
    interactions.init(handlerInput.requestEnvelope.request.locale);
  }
};
