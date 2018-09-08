const i18n = require("i18next");
const sprintf = require("i18next-sprintf-postprocessor");
const SyncBackend = require("i18next-sync-fs-backend");

const DEFAULT_GAME_CATEGORY = "general";
const categories = ["movies", "science", "technology", DEFAULT_GAME_CATEGORY];

let localizationClient;

module.exports.getQuestions = (category, locale) => {
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
          loadPath: "locales/{{lng}}/{{ns}}.json"
        },
        overloadTranslationOptionHandler:
          sprintf.overloadTranslationOptionHandler,
        returnObjects: true
      });
  }

  if (categories.includes(category)) {
    return localizationClient.t(category + ":QUESTIONS");
  }
  return localizationClient.t(DEFAULT_GAME_CATEGORY);
};
