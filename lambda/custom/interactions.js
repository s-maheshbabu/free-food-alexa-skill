const i18n = require("i18next");
const sprintf = require("i18next-sprintf-postprocessor");
const SyncBackend = require("i18next-sync-fs-backend");

let interactionsLocalizationClient;

module.exports.init = locale => {
  {
    if (!interactionsLocalizationClient) {
      if (!locale)
        throw new Error(
          "A valid locale must be provided to instantiate interactions localization client"
        );

      interactionsLocalizationClient = i18n.createInstance();
      interactionsLocalizationClient
        .use(sprintf)
        .use(SyncBackend)
        .init({
          lng: locale,
          initImmediate: false,
          ns: ["prompts"],
          defaultNS: "prompts",
          load: "all",
          backend: {
            loadPath: "locales/{{lng}}/{{ns}}.json"
          },
          overloadTranslationOptionHandler:
            sprintf.overloadTranslationOptionHandler,
          returnObjects: true
        });
    }
  }
};

module.exports.t = (...args) => {
  if (!interactionsLocalizationClient)
    throw new Error(
      "Interactions localization client hasn't been initialized. Please initialize before using translations."
    );
  return interactionsLocalizationClient.t(...args);
};
