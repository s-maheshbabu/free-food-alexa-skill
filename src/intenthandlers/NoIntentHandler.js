const interactions = require("interactions");

module.exports = NoIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "AMAZON.NoIntent"
    );
  },
  handle(handlerInput) {
    const speechOutput = interactions.t("NO_MESSAGE");
    return handlerInput.responseBuilder.speak(speechOutput).getResponse();
  }
};
