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
  const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
  const askMessage = newGame
    ? requestAttributes.t("ASK_MESSAGE_START")
    : requestAttributes.t("REPEAT_QUESTION_MESSAGE") +
      requestAttributes.t("STOP_MESSAGE");
  const speechOutput =
    requestAttributes.t("HELP_MESSAGE", GAME_LENGTH) + askMessage;
  const repromptText = requestAttributes.t("HELP_REPROMPT") + askMessage;

  return handlerInput.responseBuilder
    .speak(speechOutput)
    .reprompt(repromptText)
    .getResponse();
}
