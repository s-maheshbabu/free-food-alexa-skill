const gameManager = require("../gameManager");
const interactions = require("../interactions");

module.exports = StartGameIntentHandler = {
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
