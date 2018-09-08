const Alexa = require("ask-sdk-core");

const gameManager = require("./gameManager");

const LaunchRequestHandler = require("./requesthandlers/LaunchRequestHandler");
const SessionEndedRequestHandler = require("./requesthandlers/SessionEndedRequestHandler");

const ErrorHandler = require("./errors/ErrorHandler");

const YesIntentHandler = require("./intenthandlers/YesIntentHandler");
const StopIntentHandler = require("./intenthandlers/StopIntentHandler");
const NoIntentHandler = require("./intenthandlers/NoIntentHandler");
const CancelIntentHandler = require("./intenthandlers/CancelIntentHandler");
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
    if (request.dialogState !== "COMPLETED") {
      return handlerInput.responseBuilder.addDelegateDirective().getResponse();
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
    CancelIntentHandler,
    NoIntentHandler,
    SessionEndedRequestHandler,
    UnhandledIntentHandler
  )
  .addRequestInterceptors(LocalizationInterceptor)
  .addErrorHandlers(ErrorHandler)
  .lambda();
