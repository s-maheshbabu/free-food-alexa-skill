const Alexa = require("ask-sdk-core");

const gameManager = require("./gameManager");
const interactions = require("./interactions");

const LaunchRequestHandler = require("./requesthandlers/LaunchRequestHandler");
const SessionEndedRequestHandler = require("./requesthandlers/SessionEndedRequestHandler");

const ErrorHandler = require("./errors/ErrorHandler");

const YesIntentHandler = require("./intenthandlers/YesIntentHandler");
const StopIntentHandler = require("./intenthandlers/StopIntentHandler");
const NoIntentHandler = require("./intenthandlers/NoIntentHandler");
const RepeatIntentHandler = require("./intenthandlers/RepeatIntentHandler");
const HelpIntentHandler = require("./intenthandlers/HelpIntentHandler");
const UnhandledIntentHandler = require("./intenthandlers/UnhandledIntentHandler");

const LocalizationInterceptor = require("./interceptors/LocalizationInterceptor");

const StartGameIntent = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;

    return (
      request.type === "IntentRequest" &&
      request.intent.name === "StartGameIntent"
    );
  },
  handle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;
    const { intent } = handlerInput.requestEnvelope.request;

    if (request.dialogState !== "COMPLETED") {
      return handlerInput.responseBuilder.addDelegateDirective().getResponse();
    } else if (
      intent.slots.game_category.resolutions.resolutionsPerAuthority[0].status
        .code != "ER_SUCCESS_MATCH"
    ) {
      return handlerInput.responseBuilder
        .speak(interactions.t("CATEGORY_NOT_SUPPORTED"))
        .getResponse();
    } else {
      return gameManager.startGame(true, handlerInput);
    }
  }
};

const AnswerIntent = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      (handlerInput.requestEnvelope.request.intent.name === "AnswerIntent" ||
        handlerInput.requestEnvelope.request.intent.name === "DontKnowIntent")
    );
  },
  handle(handlerInput) {
    if (handlerInput.requestEnvelope.request.intent.name === "AnswerIntent") {
      return gameManager.handleUserGuess(false, handlerInput);
    }
    return gameManager.handleUserGuess(true, handlerInput);
  }
};

const skillBuilder = Alexa.SkillBuilders.custom();
exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    StartGameIntent,
    HelpIntentHandler,
    AnswerIntent,
    RepeatIntentHandler,
    YesIntentHandler,
    StopIntentHandler,
    NoIntentHandler,
    SessionEndedRequestHandler,
    UnhandledIntentHandler
  )
  .addRequestInterceptors(LocalizationInterceptor)
  .addErrorHandlers(ErrorHandler)
  .lambda();
