const Alexa = require('ask-sdk-core');
const utilities = require("utilities");

const interactions = require("interactions");
const CATEGORIES_NAMESPACE = "categories";

module.exports = LaunchRequest = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest' ||
      utilities.isIntent(handlerInput, 'AMAZON.StartOverIntent');
  },
  handle(handlerInput) {
    const { responseBuilder } = handlerInput;

    const welcomeMessage = interactions.t("ASK_FOR_CATEGORY", {
      postProcess: "sprintf",
      sprintf: interactions.t(CATEGORIES_NAMESPACE + ":CATEGORIES")
    });

    return responseBuilder
      .speak(welcomeMessage)
      .reprompt(welcomeMessage)
      .withShouldEndSession(false)
      .getResponse();
  }
};
