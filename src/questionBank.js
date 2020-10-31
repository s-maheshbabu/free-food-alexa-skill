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
const questionsDefaultRepoPath = "src/locales/{{lng}}/{{ns}}.json";

let localizationClient;

const getQuestions = (category, locale) => {
  if (!localizationClient) init(locale);
  // This is needed so we don't keep using 'en' when a customer with 'de' locale is being served.
  // TODO: Does this mean, we lose the previously loaded translations thereby adding to latency or
  // does it just append?
  localizationClient.changeLanguage(locale);

  if (categories.includes(category)) {
    const key = category + "||QUESTIONS";
    if (!localizationClient.exists(key)) {
      throw new Error(`Requested question set: ${key} for ${locale} locale does not exist`);
    }
    return localizationClient.t(key);
  }
  return localizationClient.t(DEFAULT_GAME_CATEGORY);
};

/**
 * Initializes the question bank.
 * 
 * @param {*} locale Locale to be loaded. This is a mandatory field.
 * will be used if path is not provided.
 * @param {*} questionsRepoOverridePath Path to the question bank. Default repo
 * will be used if path is not provided.
 */
const init = (locale, questionsRepoOverridePath) => {
  if (!locale)
    throw new Error("A valid locale must be provided to instantiate interactions localization client");

  return new Promise((resolve, reject) => {
    if (!localizationClient) {
      const path = questionsRepoOverridePath ? questionsRepoOverridePath : questionsDefaultRepoPath;

      localizationClient = i18n.createInstance();
      localizationClient
        .use(sprintf)
        .use(SyncBackend)
        .init({
          backend: {
            loadPath: path
          },
          defaultNS: DEFAULT_GAME_CATEGORY,
          initImmediate: false,
          lng: locale,
          load: "all",
          ns: categories,
          nsSeparator: '||', //TODO: Write a test to ensure question bank doesn't contain ||
          overloadTranslationOptionHandler:
            sprintf.overloadTranslationOptionHandler,
          returnObjects: true
        });
      resolve();
    } else {
      resolve();
    }
  });
};

module.exports = {
  init: init,
  getQuestions: getQuestions,
};