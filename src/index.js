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
const ResponseSanitizationInterceptor = require("./interceptors/ResponseSanitizationInterceptor");

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

async function callDirectiveService(handlerInput) {
  // Call Alexa Directive Service.
  const requestEnvelope = handlerInput.requestEnvelope;
  const directiveServiceClient = handlerInput.serviceClientFactory.getDirectiveServiceClient();

  const requestId = requestEnvelope.request.requestId;
  const endpoint = requestEnvelope.context.System.apiEndpoint;
  const token = requestEnvelope.context.System.apiAccessToken;

  console.log(`Request:${requestId}} Token: ${token}`);

  // build the progressive response directive
  const directive = {
    header: {
      requestId,
    },
    directive: {
      type: 'VoicePlayer.Speak',
      speech: `Interim response. A really long one to see if APL changes in the meantime. Weird if it did. How would it even know?`,
    },
  };

  // send directive
  return await directiveServiceClient.enqueue(directive, endpoint, token);
}

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
        LaunchRequestHandler,
        SendEventIntentHandler,
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
      .addRequestInterceptors(
        LocalizationInterceptor,
        LogRequestInterceptor,
      )
      .addResponseInterceptors(
        LogResponseInterceptor,
        //ResponseSanitizationInterceptor,
      )
      .addErrorHandlers(ErrorHandler)
      .withApiClient(new Alexa.DefaultApiClient())
      .create();
  }

  return skill.invoke(event, context);
};
