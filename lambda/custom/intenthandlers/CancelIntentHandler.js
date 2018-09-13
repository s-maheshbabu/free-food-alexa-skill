const interactions = require("../interactions");

module.exports = CancelIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "AMAZON.CancelIntent"
    );
  },
  handle(handlerInput) {
    const speechOutput = interactions.t("CANCEL_MESSAGE");

    return handlerInput.responseBuilder.speak(speechOutput).getResponse();
  }
};
