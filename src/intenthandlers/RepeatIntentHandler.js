const HelpIntentHandler = require("intenthandlers/HelpIntentHandler");

module.exports = RepeatIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "AMAZON.RepeatIntent"
    );
  },
  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    // If we are in the midst of a game, just repeat the question.
    if (sessionAttributes.questions) {
      return handlerInput.responseBuilder
        .speak(sessionAttributes.speechOutput)
        .reprompt(sessionAttributes.repromptText)
        .getResponse();
    } else {
      // Otherwise, tell the user that there is nothing to repeat and ask if they would like to continue playing.
      return HelpIntentHandler.handle(handlerInput);
    }
  }
};
