const i18n = require("i18next");
const sprintf = require("i18next-sprintf-postprocessor");
const SyncBackend = require("i18next-sync-fs-backend");

const DEFAULT_GAME_CATEGORY = "GENERAL";
const categories = [
  "ANIMALS",
  "SUSTAINABILITY",
  "SCIENCE",
  "TECHNOLOGY",
  DEFAULT_GAME_CATEGORY
];

let localizationClient;

module.exports.getQuestions = (category, locale) => {
  if (!locale)
    throw new Error(
      "A valid locale must be provided to instantiate interactions localization client"
    );

  if (!localizationClient) {
    localizationClient = i18n.createInstance();
    localizationClient
      .use(sprintf)
      .use(SyncBackend)
      .init({
        lng: locale,
        initImmediate: false,
        ns: categories,
        defaultNS: DEFAULT_GAME_CATEGORY,
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
    localizationClient.changeLanguage(locale);
  }

  if (categories.includes(category)) {
    return localizationClient.t(category + ":QUESTIONS");
  }
  return localizationClient.t(DEFAULT_GAME_CATEGORY);
};
