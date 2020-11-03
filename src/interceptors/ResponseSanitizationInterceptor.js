const hasIn = require("immutable").hasIn;
const APL_CONSTANTS = require("constants/APL");

/**
 * Sanitize the response. Retains the APL directives only if the
 * device supports APL and the requests are intent requests.
 * 
 * We want to retain the directives like Dialog delgates, Alexa Conversations
 * API responses etc. and hence the logic to only drop APL directives.
 */
module.exports = ResponseSanitizationInterceptor = {
  process(handlerInput, response) {
    const { requestEnvelope } = handlerInput;
    if (
      !hasIn(requestEnvelope, [
        "context",
        "System",
        "device",
        "supportedInterfaces",
        "Alexa.Presentation.APL"
      ]) && Array.isArray(response.directives)
    ) {
      console.log(`Stripping APL directives.`);
      response.directives = response.directives.filter(directive => directive.type !== APL_CONSTANTS.APL_DOCUMENT_TYPE && directive.type !== APL_CONSTANTS.APL_COMMANDS_TYPE)
    }

    return Promise.resolve();
  }
};
