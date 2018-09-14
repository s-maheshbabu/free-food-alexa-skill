const interactions = require("../interactions");

// TODO: This is repeated in index.js as well. Should refactor to a single place.
const GAME_LENGTH = 5;

module.exports = HelpIntentHandler = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;

    return (
      request.type === "IntentRequest" &&
      request.intent.name === "AMAZON.HelpIntent"
    );
  },
  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    const newGame = !sessionAttributes.questions;
    return helpTheUser(newGame, handlerInput);
  }
};

function helpTheUser(newGame, handlerInput) {
  const askMessage = newGame
    ? interactions.t("ASK_MESSAGE_START")
    : interactions.t("REPEAT_QUESTION_MESSAGE") +
      interactions.t("STOP_MESSAGE");
  const speechOutput = interactions.t("HELP_MESSAGE", GAME_LENGTH) + askMessage;
  const repromptText = interactions.t("HELP_REPROMPT") + askMessage;

  return handlerInput.responseBuilder
    .speak(speechOutput)
    .reprompt(repromptText)
    .getResponse();
}
