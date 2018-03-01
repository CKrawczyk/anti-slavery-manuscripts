import React from 'react';

function constructCoordinates(line) {
  const points = [];
  if (line && line.clusters_x && line.clusters_y) {
    line.clusters_x.map((point, i) => {
      points.push({ x: line.clusters_x[i], y: line.clusters_y[i] });
    })
  }
  return points;
};

function constructText(line) {
  const sentences = [];
  if (line && line.clusters_text) {
    line.clusters_text.map((value) => {
      value.map((word, i) => {
        if (!sentences[i]) { sentences[i] = []; }
        if (word && word.length) { sentences[i].push(word); }
      })
    });
  }
  return sentences.map(value => value.join(' '));
}

function constructUniqueWordCount(line) {
  const sentences = [];
  if (line && line.clusters_text) {
    line.clusters_text.map((words) => {
      const wordCount = {};
      words.forEach((word) => {
        if (word) {
          wordCount[word] = 1 + (wordCount[word] || 0);
        }
      });
      sentences.push(wordCount);
    });
  }
  return sentences;
}

export { constructCoordinates, constructText, constructUniqueWordCount };
