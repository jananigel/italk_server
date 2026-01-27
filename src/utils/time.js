function pad(value) {
  return value < 10 ? `0${value}` : `${value}`;
}

function formatTimestamp(date = new Date()) {
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const year = date.getFullYear();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${month}/${day}/${year} ${hours}:${minutes}`;
}

module.exports = {
  formatTimestamp
};
