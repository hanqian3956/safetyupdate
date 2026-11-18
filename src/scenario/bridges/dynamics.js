// Inject daily-inspection events into the embedded dynamics prototype.
(function (host) {
  "use strict";
  if (!host || typeof feeds === "undefined" || typeof FEEDNOS === "undefined") return;

  var view = host.views.dynamics();
  var prefix = "insp-";

  function renameLegacy(text) {
    return typeof text === "string" ? text.split(view.formName).join(view.legacyFormName) : text;
  }

  BIZLIB.form.forEach(function (biz) {
    if (biz.id !== view.biz.form.id) biz.name = renameLegacy(biz.name);
  });
  feeds.forEach(function (feed) {
    feed.title = renameLegacy(feed.title);
    feed.summary = renameLegacy(feed.summary);
    if (feed.related) feed.related.label = renameLegacy(feed.related.label);
  });
  Object.keys(RECORDS).forEach(function (id) {
    var record = RECORDS[id];
    record.kicker = renameLegacy(record.kicker);
    record.title = renameLegacy(record.title);
    record.fields = record.fields.map(function (field) { return field.map(renameLegacy); });
  });
  if (typeof timeline !== "undefined") {
    timeline.forEach(function (item) { item.text = renameLegacy(item.text); });
  }

  ["form", "process", "task"].forEach(function (kind) {
    var business = view.biz[kind];
    if (!BIZLIB[kind].some(function (item) { return item.id === business.id; })) {
      BIZLIB[kind].push(business);
    }
  });

  for (var index = FEEDNOS.length - 1; index >= 0; index -= 1) {
    if (FEEDNOS[index].id === view.feedNo.id) FEEDNOS.splice(index, 1);
  }
  FEEDNOS.unshift(view.feedNo);

  for (var feedIndex = feeds.length - 1; feedIndex >= 0; feedIndex -= 1) {
    if (feeds[feedIndex].id.indexOf(prefix) === 0) feeds.splice(feedIndex, 1);
  }
  view.feeds.forEach(function (feed) { feeds.push(feed); });
  feeds.sort(function (left, right) { return (right.ts || 0) - (left.ts || 0); });

  Object.keys(view.records).forEach(function (id) { RECORDS[id] = view.records[id]; });

  if (typeof renderFilters === "function") renderFilters();
  if (typeof renderFeed === "function") renderFeed();
})(window.__inspectionHost);
