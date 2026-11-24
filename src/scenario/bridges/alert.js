// Inject daily-inspection alert rules and records into the embedded warning prototype.
(function (host) {
  "use strict";
  if (!host || typeof ruleListData === "undefined" || typeof detailData === "undefined") return;

  var marker = "inspection";
  var view = host.views.alerts();
  var alertsById = {};
  var escapeHtml = function (text) {
    return String(text == null ? "" : text).replace(/[&<>"]/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[character];
    });
  };
  var hitRows = function (alert) {
    return alert.items.map(function (item) {
      return "<tr><td>" + escapeHtml(item.name) + "</td><td>" + escapeHtml(item.judge) + "</td><td>" + escapeHtml(item.thr) + '</td><td class="text-danger">' + escapeHtml(item.act) + "</td></tr>";
    }).join("");
  };
  var rowHtml = function (alert) {
    var state = alert.done ? "已处理" : "未处理";
    var status = alert.done
      ? '<span class="tag tag-success">已完成</span>' + (alert.overdue ? '<span class="ovd ovd-done">超期完成</span>' : "")
      : '<span class="tag tag-danger">未处理</span>' + (alert.overdue ? '<span class="ovd ovd-late">已超期</span>' : "");
    var actions = alert.done
      ? '<button class="btn-text btn-sm" onclick="showTaskDetailModalFromRow(this)">查看</button>'
      : '<button class="btn-text btn-sm" onclick="showTaskDetailModalFromRow(this)">处理</button><button class="btn-text btn-sm" onclick="showForwardModal()">转发</button>';
    var detailId = "hd-insp-" + alert.id;
    return '<tr data-scenario="' + marker + '">'
      + '<td class="wrn-link" onclick="showTaskDetailModal(\'' + alert.id + "', 'task')\">" + alert.id + "</td>"
      + "<td>" + escapeHtml(view.sheet) + '</td><td><span class="wc-title">' + escapeHtml(alert.content) + "</span></td>"
      + '<td class="hit-cell" onclick="toggleHitDetail(\'' + detailId + "')\">" + escapeHtml(alert.items[0].name) + '<span class="hit-caret"></span></td>'
      + '<td><span class="' + alert.levelClass + '">● ' + escapeHtml(alert.level) + "</span></td>"
      + '<td class="cond-cell hit-cell" onclick="showAssigneeModal(\'' + alert.id + "')\"><span class=\"cond-main\">" + escapeHtml(view.user) + "</span>"
      + '<div class="cond-tip"><div class="cond-tip-title">处理人（共 1 人 · 已处理 ' + (alert.done ? 1 : 0) + "/1）</div><div>· " + escapeHtml(view.user) + "（" + escapeHtml(view.handlerRole) + "）· " + state + "</div></div></td>"
      + "<td>" + alert.time + "</td><td>" + alert.due + "</td><td>" + status + "</td><td>" + actions + "</td></tr>"
      + '<tr class="hit-detail-row" data-scenario="' + marker + '" id="' + detailId + '" style="display:none;"><td colspan="10"><div class="hit-detail-inner"><table class="hit-detail-table">'
      + "<thead><tr><th>工作项</th><th>判定</th><th>预警值（阈值）</th><th>触发值（实测）</th></tr></thead><tbody>" + hitRows(alert) + "</tbody></table></div></td></tr>";
  };

  function sync() {
    view = host.views.alerts();
    alertsById = {};
    if (typeof sheetPickerData !== "undefined" && sheetPickerData[0] && sheetPickerData[0].sheets.indexOf(view.sheet) < 0) sheetPickerData[0].sheets.unshift(view.sheet);
    var ruleIds = view.rules.map(function (rule) { return rule.id; });
    for (var index = ruleListData.length - 1; index >= 0; index -= 1) if (ruleIds.indexOf(ruleListData[index].id) >= 0) ruleListData.splice(index, 1);
    view.rules.slice().reverse().forEach(function (rule) { ruleListData.unshift(rule); });
    if (document.getElementById("ruleListBody") && typeof renderRuleList === "function") renderRuleList();

    document.querySelectorAll('[data-scenario="' + marker + '"]').forEach(function (node) { node.remove(); });
    var pending = [];
    var done = [];
    view.alerts.forEach(function (alert) {
      alertsById[alert.id] = alert;
      var state = alert.done ? "已处理" : "未处理";
      detailData[alert.id] = { sheet: view.sheet, content: alert.content, time: alert.timeFull, level: alert.level, levelClass: alert.levelClass, type: alert.type, handler: view.user, due: alert.dueFull, dueDanger: !alert.done, actual: alert.done ? view.user : "—", actualTime: alert.done ? alert.handledAtFull : "—", items: alert.items };
      assigneeData[alert.id] = { snapshot: alert.time, assignees: [{ name: view.user, from: view.handlerRole, status: state, time: alert.done ? alert.handledAt : "—" }] };
      logData[alert.id] = alert.logs;
      disposalData[alert.id] = { trigger: alert.timeFull, records: [alert.done ? { name: view.user, from: view.handlerRole, status: "已提交", time: alert.handledAtFull, content: alert.disposal, files: [], signed: "已签字" } : { name: view.user, from: view.handlerRole, status: "未提交" }] };
      (alert.done ? done : pending).push(rowHtml(alert));
    });
    var pendingBody = document.querySelector("#task-pending-content tbody");
    var doneBody = document.querySelector("#task-done-content tbody");
    if (pendingBody) pendingBody.insertAdjacentHTML("afterbegin", pending.join(""));
    if (doneBody) doneBody.insertAdjacentHTML("afterbegin", done.join(""));
    // Rows are injected after the prototype creates its independent overdue column.
    // Run that normalizer again so both pending and completed rows retain the action column.
    if (typeof window.addWarningTaskOverdueColumn === "function") window.addWarningTaskOverdueColumn();
    var badge = document.querySelector("#task-tabs .tab-item .tag");
    if (badge && pendingBody) badge.textContent = pendingBody.querySelectorAll(":scope > tr:not(.hit-detail-row)").length;
  }

  var originalShowTaskDetail = window.showTaskDetailModal;
  window.showTaskDetailModal = function (warningId, mode) {
    originalShowTaskDetail.apply(this, arguments);
    var alert = alertsById[warningId];
    var editing = !mode || mode === "edit";
    if (!alert || !editing) return;
    var input = document.querySelector("#tdDisposalEdit textarea");
    if (input) input.value = "";
    var actual = document.getElementById("tdActual");
    if (actual) actual.value = view.user;
  };
  document.addEventListener("click", function (event) {
    if (!event.target.closest || !event.target.closest("#tdSubmitBtn")) return;
    var alert = alertsById[_detailWarnId];
    if (!alert || alert.done) return;
    event.stopPropagation();
    event.preventDefault();
    var input = document.querySelector("#tdDisposalEdit textarea");
    var content = input ? input.value.trim() : "";
    if (!content) { toast("warning", "请填写处理情况"); input?.focus(); return; }
    host.handleAlert(alert.id, content);
    if (input) input.value = "";
    closeModal("modal-task-detail");
    sync();
    toast("success", "处置已提交，" + alert.id + " 已闭环，并记录到「" + view.feedNoName + "」");
  }, true);
  sync();
})(window.__inspectionHost);
