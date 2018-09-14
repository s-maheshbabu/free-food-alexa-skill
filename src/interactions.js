const i18n = require("i18next");
const sprintf = require("i18next-sprintf-postprocessor");
const SyncBackend = require("i18next-sync-fs-backend");

let interactionsLocalizationClient;

module.exports.init = locale => {
  {
    if (!locale)
      throw new Error(
        "A valid locale must be provided to instantiate interactions localization client"
      );

    if (!interactionsLocalizationClient) {
      interactionsLocalizationClient = i18n.createInstance();
      interactionsLocalizationClient
        .use(sprintf)
        .use(SyncBackend)
        .init({
          lng: locale,
          initImmediate: false,
          ns: ["prompts", "categories"],
          defaultNS: "prompts",
          load: "all",
          backend: {
            loadPath: "src/locales/{{lng}}/{{ns}}.json"
          },
          overloadTranslationOptionHandler:
            sprintf.overloadTranslationOptionHandler,
          returnObjects: true
        });
    } else {
      // This is needed so we don't keep using 'en' when a customer with 'de' locale is being served.
      // TODO: Does this mean, we lose the previously loaded translations thereby adding to latency or
      // does it just append?
      interactionsLocalizationClient.changeLanguage(locale);
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
