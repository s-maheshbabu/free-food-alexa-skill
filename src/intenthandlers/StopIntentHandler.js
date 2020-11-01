const interactions = require("interactions");

module.exports = StopIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      (handlerInput.requestEnvelope.request.intent.name ===
        "AMAZON.StopIntent" ||
        handlerInput.requestEnvelope.request.intent.name ===
        "AMAZON.CancelIntent")
    );
  },
  handle(handlerInput) {
    const speechOutput = interactions.t("EXIT_MESSAGE");
    return handlerInput.responseBuilder.speak(speechOutput).getResponse();
  }
};
