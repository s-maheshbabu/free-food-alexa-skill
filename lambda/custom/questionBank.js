const Map = require("immutable").Map;

const DEFAULT_GAME_CATEGORY = "default";

const questionBanksMap = Map({
  movies: require("./resources/movieQuestions"),
  science: require("./resources/scienceQuestions"),
  technology: require("./resources/technologyQuestions"),
  DEFAULT_GAME_CATEGORY: require("./resources/defaultQuestions")
});

module.exports.getQuestions = category => {
  if (questionBanksMap.has(category)) {
    return questionBanksMap.get(category);
  }
  return questionBanksMap.get(DEFAULT_GAME_CATEGORY);
};
