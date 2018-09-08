const gameManager = require("../gameManager");
const interactions = require("../interactions");

// TODO: Defined at two places in the code. Refactor.
const CATEGORIES_NAMESPACE = "categories";

module.exports = YesIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "AMAZON.YesIntent"
    );
  },
  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    if (sessionAttributes.questions) {
      return handlerInput.responseBuilder
        .speak(sessionAttributes.speechOutput)
        .reprompt(sessionAttributes.repromptText)
        .getResponse();
    }
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
