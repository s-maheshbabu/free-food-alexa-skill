const Alexa = require("ask-sdk-core");

const gameManager = require("./gameManager");

const LaunchRequestHandler = require("./requesthandlers/LaunchRequestHandler");
const SessionEndedRequestHandler = require("./requesthandlers/SessionEndedRequestHandler");

const ErrorHandler = require("./errors/ErrorHandler");

const AnswerIntentHandler = require("./intenthandlers/AnswerIntentHandler");
const HelpIntentHandler = require("./intenthandlers/HelpIntentHandler");
const NoIntentHandler = require("./intenthandlers/NoIntentHandler");
const RepeatIntentHandler = require("./intenthandlers/RepeatIntentHandler");
const StartGameIntentHandler = require("./intenthandlers/StartGameIntentHandler");
const StopIntentHandler = require("./intenthandlers/StopIntentHandler");
const UnhandledIntentHandler = require("./intenthandlers/UnhandledIntentHandler");
const YesIntentHandler = require("./intenthandlers/YesIntentHandler");

const LocalizationInterceptor = require("./interceptors/LocalizationInterceptor");
const ResponseSanitizationInterceptor = require("./interceptors/ResponseSanitizationInterceptor");

const SendEventIntentHandler = {
  canHandle(handlerInput) {
    // Check for SendEvent sent from the button
    return handlerInput.requestEnvelope.request.type === 'Alexa.Presentation.APL.UserEvent'
  },
  handle(handlerInput) {
    const {
      responseBuilder
    } = handlerInput;

    // Take argument sent from the button to speak back to the user
    console.log(`User selected #${handlerInput.requestEnvelope.request.arguments[0]} : ${handlerInput.requestEnvelope.request.arguments[1]}`);
    if (handlerInput.requestEnvelope.request.arguments[2] === `AUTO_GENERATED`)
      return gameManager.handleUserGuess_ForEvent(parseInt(handlerInput.requestEnvelope.request.arguments[0], 10) + 1, handlerInput);
    else if (handlerInput.requestEnvelope.request.arguments[2] === `USER_VOICE_INITIATED`) {
      const aploc = {
        type: "APL",
        version: "1.0",
        mainTemplate: {
          parameters: [
            "payload"
          ],
          items: [
            {
              type: "Text",
              text: "USER_VOICE_INITIATED event. Been showing results so far. Now it is time to switch to APL that shows the question. Pretend this is the question APL Doc."
            }
          ]
        }
      };
      return responseBuilder
        // Add this to render APL document
        .addDirective({
          type: 'Alexa.Presentation.APL.RenderDocument',
          version: '1.0',
          token: "dummyTokens",
          document: aploc,
        })
        .speak('We read the new question and answers here.')
        .getResponse();
    }

    const sendEventCommand = {
      type: "SendEvent",
      arguments: [
        parseInt(handlerInput.requestEnvelope.request.arguments[0], 10),
        handlerInput.requestEnvelope.request.arguments[1],
        `AUTO_GENERATED`,
      ]
    };
    const aploc = {
      type: "APL",
      version: "1.0",
      mainTemplate: {
        parameters: [
          "payload"
        ],
        items: [
          {
            type: "Text",
            text: "USER_INITIATED Declare whether the answer is right or wrong and may be show the score too."
          }
        ]
      }
    };
    return responseBuilder
      // Add this to render APL document
      .addDirective({
        type: 'Alexa.Presentation.APL.RenderDocument',
        version: '1.0',
        token: "dummyToken",
        document: aploc,
      }).addDirective({
        type: 'Alexa.Presentation.APL.ExecuteCommands',
        token: "dummyToken",
        commands: [sendEventCommand]
      })
      .speak('I declare whether the answer is correct or not and then create an AUTO_GENERATED UserEvent')
      .getResponse();
  }
};

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
        AnswerIntent,
        AnswerIntentHandler,
        HelpIntentHandler,
        LaunchRequestHandler,
        NoIntentHandler,
        RepeatIntentHandler,
        SendEventIntentHandler,
        SessionEndedRequestHandler,
        StartGameIntentHandler,
        StopIntentHandler,
        UnhandledIntentHandler,
        YesIntentHandler,
      )
      .addRequestInterceptors(
        LogRequestInterceptor,
        LocalizationInterceptor,
      )
      .addResponseInterceptors(
        //ResponseSanitizationInterceptor,
        LogResponseInterceptor,
      )
      .addErrorHandlers(ErrorHandler)
      .withApiClient(new Alexa.DefaultApiClient())
      .create();
  }

  return skill.invoke(event, context);
};
