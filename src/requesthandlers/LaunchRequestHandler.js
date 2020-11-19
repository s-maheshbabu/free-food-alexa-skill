const Alexa = require('ask-sdk-core');
const utilities = require("utilities");
const APL = require("constants/APL");

const interactions = require("interactions");
const CATEGORIES_NAMESPACE = "categories";

const launchGameAudioDatasource = require("responses/LaunchGame/datasources/default");
const launchGameAudioDocument = require("responses/LaunchGame/document");

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
      .addDirective({
        type: APL.APLA_DOCUMENT_TYPE,
        document: launchGameAudioDocument,
        datasources: launchGameAudioDatasource(welcomeMessage),
      })
      .reprompt(welcomeMessage)
      .withShouldEndSession(false)
      .getResponse();
  }
};
