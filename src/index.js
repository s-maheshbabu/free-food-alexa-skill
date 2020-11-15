require("app-module-path").addPath(__dirname);

const Alexa = require("ask-sdk-core");

const LaunchRequestHandler = require("requesthandlers/LaunchRequestHandler");
const SessionEndedRequestHandler = require("requesthandlers/SessionEndedRequestHandler");

const ErrorHandler = require("errors/ErrorHandler");

const AnswerIntentHandler = require("intenthandlers/AnswerIntentHandler");
const HelpIntentHandler = require("intenthandlers/HelpIntentHandler");
const NoIntentHandler = require("intenthandlers/NoIntentHandler");
const RepeatIntentHandler = require("intenthandlers/RepeatIntentHandler");
const StartGameIntentHandler = require("intenthandlers/StartGameIntentHandler");
const StopIntentHandler = require("intenthandlers/StopIntentHandler");
const UnhandledIntentHandler = require("intenthandlers/UnhandledIntentHandler");
const YesIntentHandler = require("intenthandlers/YesIntentHandler");

const UserEventHandler = require("eventhandlers/UserEventHandler");

const LocalizationInterceptor = require("interceptors/LocalizationInterceptor");
const ResponseSanitizationInterceptor = require("interceptors/ResponseSanitizationInterceptor");

const LogRequestInterceptor = {
  process(handlerInput) {
    console.log(`REQUEST ENVELOPE = ${JSON.stringify(handlerInput.requestEnvelope)}`);
  },
};

const LogResponseInterceptor = {
  process(handlerInput, response) {
    console.log(`RESPONSE = ${JSON.stringify(response)}`);
  },
};

let skill;

exports.handler = async function (event, context) {
  if (!skill) {
    skill = Alexa.SkillBuilders.custom()
      .addRequestHandlers(
        AnswerIntentHandler,
        HelpIntentHandler,
        LaunchRequestHandler,
        NoIntentHandler,
        RepeatIntentHandler,
        StartGameIntentHandler,
        StopIntentHandler,
        UserEventHandler,
        YesIntentHandler,

        SessionEndedRequestHandler,
        UnhandledIntentHandler,
      )
      .addRequestInterceptors(
        LogRequestInterceptor,
        LocalizationInterceptor,
      )
      .addResponseInterceptors(
        ResponseSanitizationInterceptor,
        LogResponseInterceptor,
      )
      .addErrorHandlers(ErrorHandler)
      .withApiClient(new Alexa.DefaultApiClient())
      .create();
  }

  return skill.invoke(event, context);
};
