const interactions = require("../interactions");
const CATEGORIES_NAMESPACE = "categories";

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
    return handlerInput.responseBuilder
      .speak(
        interactions.t("ASK_FOR_CATEGORY", {
          postProcess: "sprintf",
          sprintf: interactions.t(CATEGORIES_NAMESPACE + ":CATEGORIES")
        })
      )
      .withShouldEndSession(false)
      .getResponse();
  }
};
