'use strict';
function playmode(player, values) {
  if (values[0] !== 'normal') {
    throw new Error('Supported playmode: normal');
  }
  // Set both fields in one SOAP call; separate calls merge stale event state.
  return player.coordinator.setPlayMode({ repeat: 'none', shuffle: false });
}

function repeat(player, values) {
  let mode = values[0];

  if (mode === "on") {
    mode = "all";
  } else if (mode === "off") {
    mode = "none";
  }

  return player.coordinator.repeat(mode);
}

function shuffle(player, values) {
  return player.coordinator.shuffle(values[0] == "on" ? true : false);
}

function crossfade(player, values) {
  return player.coordinator.crossfade(values[0] == "on" ? true : false);
}

module.exports = function (api) {
  api.registerAction('playmode', playmode);
  api.registerAction('repeat', repeat);
  api.registerAction('shuffle', shuffle);
  api.registerAction('crossfade', crossfade);
}
