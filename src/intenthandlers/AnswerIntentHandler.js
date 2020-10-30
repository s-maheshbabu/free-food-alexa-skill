const gameManager = require("../gameManager");

module.exports = AnswerIntent = {
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
