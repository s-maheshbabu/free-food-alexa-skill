const interactions = require("../interactions");

module.exports = LaunchRequest = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;

    return (
      request.type === "LaunchRequest" ||
      (request.type === "IntentRequest" &&
        request.intent.name === "AMAZON.StartOverIntent")
    );
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();

    return handlerInput.responseBuilder
      .speak(interactions.t("ASK_FOR_CATEGORY"))
      .withShouldEndSession(false)
      .getResponse();
  }
};
