const hasIn = require("immutable").hasIn;

/**
 * Sanitize the response. Retains the APL directives only if the
 * device supports APL and the requests are intent requests.
 * 
 * We want to retain the directives for Alexa Conversations API responses.
 * The current logic will fail if we even decide to send APL responses
 * in Alexa Conversations API responses.
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
      ])
    ) {
      console.log('Stripping unnecessary directives.')
      response.directives = undefined;
    }

    return Promise.resolve();
  }
};
