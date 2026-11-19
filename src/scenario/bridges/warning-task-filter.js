// Runs inside the warning iframe after its initial task rows are available.
(function () {
  var bar = document.getElementById("task-search-bar");
  if (!bar) return;
  var keywordInput = bar.querySelector('input[placeholder*="预警工作项"]');
  if (!keywordInput) return;
  keywordInput.id = "taskWorkItemFilter";
  keywordInput.setAttribute("aria-label", "预警工作项");
  keywordInput.placeholder = "预警内容或工作项";
  keywordInput.maxLength = 100;
  keywordInput.style.width = "200px";
  var originalSearch = window.searchTaskWarnings;
  var originalReset = window.resetTaskWarningSearch;

  window.searchTaskWarnings = function () {
    if (typeof originalSearch === "function") originalSearch();
    var keyword = keywordInput.value.trim().toLowerCase();
    var panel = document.querySelector("#page-warning-task .task-tab-content.active");
    if (!panel) return;
    var table = panel.querySelector(".data-table");
    if (!table) return;
    var headings = Array.from(table.querySelectorAll(":scope > thead > tr > th"));
    var column = function (name) { return headings.findIndex(function (th) { return th.textContent.trim() === name; }); };
    var contentIndex = column("预警内容"), itemIndex = column("预警工作项");
    table.querySelectorAll(":scope > tbody > tr:not(.hit-detail-row)").forEach(function (row) {
      if (row.cells.length < headings.length) return;
      var detail = row.nextElementSibling;
      var detailText = detail && detail.classList.contains("hit-detail-row")
        ? Array.from(detail.querySelectorAll("tbody tr")).map(function (hit) { return hit.cells[0]?.textContent || ""; }).join(" ") : "";
      var text = [row.cells[contentIndex]?.textContent, row.cells[itemIndex]?.textContent, detailText].join(" ").toLowerCase();
      if (keyword && text.indexOf(keyword) === -1) row.style.display = "none";
      if (detail && detail.classList.contains("hit-detail-row")) detail.style.display = "none";
    });
  };
  window.resetTaskWarningSearch = function () {
    keywordInput.value = "";
    if (typeof originalReset === "function") originalReset();
    window.searchTaskWarnings();
  };
  var originalTab = window.switchTaskTab;
  window.switchTaskTab = function () {
    if (typeof originalTab === "function") originalTab.apply(this, arguments);
    window.searchTaskWarnings();
  };
  bar.addEventListener("keydown", function (event) {
    if (event.key === "Enter") { event.preventDefault(); window.searchTaskWarnings(); }
  });
  var taskPage = document.getElementById("page-warning-task");
  if (taskPage) new MutationObserver(function () {
    window.searchTaskWarnings();
  }).observe(taskPage, { childList: true, subtree: true });
  if (hostWarningKeyword || hostWarningTaskTab) {
    var initialTaskTab = hostWarningTaskTab || "task-pending";
    var initialTab = document.querySelector('#task-tabs [onclick*="' + initialTaskTab + '"]');
    if (initialTab) window.switchTaskTab(initialTab, initialTaskTab);
  }
  if (hostWarningKeyword) {
    keywordInput.value = hostWarningKeyword;
    window.searchTaskWarnings();
  }
})();
