const interactions = require("../interactions");

module.exports = UnhandledIntentHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    if (Object.keys(sessionAttributes).length === 0) {
      const speechOutput = interactions.t("START_UNHANDLED");
      return handlerInput.attributesManager
        .speak(speechOutput)
        .reprompt(speechOutput)
        .getResponse();
    } else if (sessionAttributes.questions) {
      const speechOutput = interactions.t(
        "TRIVIA_UNHANDLED",
        ANSWER_COUNT.toString()
      );
      return handlerInput.attributesManager
        .speak(speechOutput)
        .reprompt(speechOutput)
        .getResponse();
    }
    const speechOutput = interactions.t("HELP_UNHANDLED");
    return handlerInput.attributesManager
      .speak(speechOutput)
      .reprompt(speechOutput)
      .getResponse();
  }
};
