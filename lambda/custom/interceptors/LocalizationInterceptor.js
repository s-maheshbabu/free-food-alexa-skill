const i18n = require("i18next");
const sprintf = require("i18next-sprintf-postprocessor");

const prompts = require("../resources/prompts");

module.exports = LocalizationInterceptor = {
  process(handlerInput) {
    const localizationClient = i18n.use(sprintf).init({
      lng: handlerInput.requestEnvelope.request.locale,
      overloadTranslationOptionHandler:
        sprintf.overloadTranslationOptionHandler,
      resources: prompts,
      returnObjects: true
    });

    const attributes = handlerInput.attributesManager.getRequestAttributes();
    attributes.t = function(...args) {
      return localizationClient.t(...args);
    };
    attributes.addResourceBundle = function(lng, ns, resources) {
      localizationClient.addResourceBundle(lng, ns, resources, true);
    };
    attributes.getResourceBundle = function(lng, ns) {
      return localizationClient.getResourceBundle(lng, ns);
    };
  }
};
