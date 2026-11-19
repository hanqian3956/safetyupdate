// 任务原型（xiaodong/最新的任务.html）里的桥接脚本，由 embed.js 注入到 iframe 中运行。
// 作用：把「每日巡检任务」放进任务原型，执行页换成《日常巡检表》，提交后写回场景数据层。
// 这里引用的 EXEC_INFO、renderExecPage 等都是任务原型自己的全局变量和函数。

(function (host) {
  "use strict";
  if (!host || typeof window.renderExecPage !== "function") return;

  var MARK = "inspection";
  var view = host.views.task();
  var byId = {};

  var esc = function (text) {
    return String(text == null ? "" : text).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  };
  var dash = '<span style="color:var(--text-muted);font-size:11px;">\u2014</span>';
  var overdueMark = '<span class="overdue-mark"><i class="bi bi-exclamation-triangle-fill"></i>超期</span>';
  var name = view.task.name;

  function instanceOfRow(row) {
    return row && row.dataset ? byId[row.dataset.tid] || null : null;
  }

  // ---------------------------------------------------------------- 列表与原型数据

  function rowAttrs(inst, prog) {
    return ' data-scenario="' + MARK + '" data-tid="' + inst.id + '" data-prog="' + prog + '" data-name="' + esc(name) + '" data-ft="' + esc(view.formName) + '"';
  }

  function statusHtml(inst) {
    return inst.status === "done" ? '<span class="status status-done">已完成</span>' : '<span class="status status-pending">未执行</span>';
  }

  function removeMarked(root) {
    root.querySelectorAll('[data-scenario="' + MARK + '"]').forEach(function (node) { node.remove(); });
  }

  function prepend(selector, html) {
    var body = document.querySelector(selector);
    if (body && html) body.insertAdjacentHTML("afterbegin", html);
  }

  function setTabCount(tabSelector, bodySelector) {
    var badge = document.querySelector(tabSelector + " .num");
    var body = document.querySelector(bodySelector);
    if (badge && body) badge.textContent = body.querySelectorAll("tr").length;
  }

  function sync() {
    view = host.views.task();
    byId = {};
    removeMarked(document);

    var pending = [], done = [], forwarded = [], ledger = [];
    view.instances.forEach(function (inst) {
      byId[inst.id] = inst;
      var executor = inst.status === "forwarded" ? inst.forwardedTo : view.user;
      var prog = inst.status === "done" ? "1/1" : "0/1";
      var over = inst.overdue ? overdueMark : dash;
      var submitted = inst.status === "done";

      EXEC_INFO[inst.id] = {
        starter: view.task.initiator, exec: executor, part: view.task.participant, work: view.task.workType,
        loc: view.task.location, span: inst.span, pe: inst.deadline, desc: view.task.description
      };
      INST_DETAIL[inst.id] = {
        form: view.formName, work: view.task.workType, loc: view.task.location, span: inst.span, pe: inst.deadline,
        plan: name + "（周期）", desc: view.task.description,
        signers: [{ n: executor, s: submitted ? "已提交" : "未提交", t: submitted ? inst.submittedAt : "\u2014", o: inst.overdue }],
        mine: submitted ? { submitted: true, t: inst.submittedAt, form: view.formName, desc: "已按《" + view.formName + "》完成填报", files: inst.values.photos || "\u2014" } : { submitted: false }
      };
      PART_OF[inst.id] = view.task.participant;
      LOG_DEMO[inst.id] = [{ who: "系统", act: "已发布", time: inst.publishedAt, kind: "publish" }];
      if (inst.status === "forwarded") {
        LOG_DEMO[inst.id].push({ who: view.user + " \u2192 " + inst.forwardedTo, act: "已转办", time: inst.forwardedAt, kind: "transfer", from: view.user, to: inst.forwardedTo, reason: "\u2014" });
        LOG_DEMO[inst.id].push({ who: inst.forwardedTo, act: "未提交", time: "", over: inst.overdue, kind: "pending" });
      } else if (submitted) {
        LOG_DEMO[inst.id].push({ who: view.user, act: "已提交", time: inst.submittedAt, over: inst.overdue, kind: "submit", person: view.user });
        SUBMIT_BY[inst.id] = {};
        SUBMIT_BY[inst.id][view.user] = { ft: view.formName, t: inst.submittedAt, files: inst.values.photos || "\u2014" };
      } else {
        LOG_DEMO[inst.id].push({ who: view.user, act: "未提交", time: "", over: inst.overdue, kind: "pending" });
      }

      var head = "<tr" + rowAttrs(inst, prog) + "><td>" + esc(name) + '</td><td style="font-size:11px;">' + inst.publishedAt + "</td>";
      if (inst.status === "pending") {
        pending.push(head + "<td>" + esc(executor) + "</td><td>" + statusHtml(inst) + "</td><td>" + over + '</td><td><div class="actions"><button class="btn btn-amber btn-xs act-exec">执行</button><button class="btn btn-ghost btn-xs act-forward">转办</button></div></td></tr>');
      } else if (submitted) {
        done.push(head + "<td>" + esc(executor) + "</td><td>" + statusHtml(inst) + '</td><td style="font-size:11px;color:var(--text-secondary);">' + inst.submittedAt + "</td><td>" + over + '</td><td><div class="actions"><button class="btn btn-ghost btn-xs act-inst-detail">查看</button></div></td></tr>');
      } else {
        forwarded.push(head + "<td>" + esc(inst.forwardedTo) + '</td><td style="font-size:11px;color:var(--text-secondary);">' + inst.forwardedAt + '</td><td><div class="actions"><button class="btn btn-ghost btn-xs act-inst-detail">查看</button></div></td></tr>');
      }
      ledger.push("<tr" + rowAttrs(inst, prog) + ' data-exec="' + esc(executor) + '" data-pending="' + (submitted ? "" : esc(executor)) + '"><td>' + esc(name) + '</td><td style="font-size:11px;">' + inst.publishedAt
        + '</td><td><button class="inst-link act-person-list">' + esc(executor) + "</button></td><td>" + statusHtml(inst) + "</td><td>" + over
        + '</td><td><div class="actions"><button class="btn btn-ghost btn-xs act-inst-detail">详情</button></div></td></tr>');
    });

    prepend("#t-exec tbody", pending.join(""));
    prepend("#t-done tbody", done.join(""));
    prepend("#t-forward tbody", forwarded.join(""));
    prepend("#lt-inst", ledger.join(""));

    // Newly injected execution rows need the same ID column as the prototype rows.
    if (typeof renderTaskInstanceIds === "function") renderTaskInstanceIds();

    // 周期计划：发布任务 › 我发起的、任务总台账 › 任务总览。
    var plan = view.plan;
    var count = view.instances.length;
    var countButton = '<button class="inst-link act-inst-list" data-tid="' + plan.id + '">' + count + " 次</button>";
    var planAttrs = ' data-scenario="' + MARK + '" data-tid="' + plan.id + '" data-name="' + esc(name) + '"';
    var pauseButton = '<button class="btn btn-xs act-pause" style="color:#a05a00;border:1px solid #e0b070;">暂停</button>';
    prepend("#launchBody", "<tr" + planAttrs + "><td>" + esc(name) + "</td><td>周期</td><td>" + countButton
      + '</td><td><span class="status status-pending">进行中</span></td><td style="font-size:11px;color:var(--text-secondary);">' + plan.createdAt
      + '</td><td><div class="actions"><button class="btn btn-ghost btn-xs act-edit-plan">编辑计划</button>' + pauseButton
      + '<button class="btn btn-ghost btn-xs act-copy-plan">复制</button><button class="btn btn-danger btn-xs act-stop-plan">终止</button></div></td></tr>');
    prepend("#lt-task", "<tr" + planAttrs + "><td>" + esc(name) + "</td><td>周期</td><td>" + esc(view.task.initiator) + "</td><td>" + countButton
      + '</td><td><span class="status status-pending plan-status">进行中</span></td><td><div class="actions"><button class="btn btn-ghost btn-xs act-edit-plan">编辑计划</button><button class="btn btn-ghost btn-xs act-view-plan">查看计划</button>'
      + pauseButton + '<button class="btn btn-danger btn-xs act-stop-plan">终止</button></div></td></tr>');

    PLAN_DEMO[plan.id] = {
      name: name, exec: [view.task.executor], part: [view.task.participant], form: view.formName,
      start: plan.start, end: plan.end, desc: view.task.description, repeatOn: true, freq: "按天", times: ["08:00"]
    };
    INST_DEMO[plan.id] = view.instances.map(function (inst) {
      return {
        id: inst.id, time: inst.publishedAt, who: inst.status === "forwarded" ? inst.forwardedTo : view.user,
        prog: inst.status === "done" ? "1/1" : "0/1", over: inst.overdue ? (inst.status === "done" ? "done" : true) : false
      };
    });

    setTabCount('#myTabs .tab[data-tab="t-exec"]', "#t-exec tbody");
    setTabCount('#myTabs .tab[data-tab="t-done"]', "#t-done tbody");
    setTabCount('#myTabs .tab[data-tab="t-forward"]', "#t-forward tbody");
    setTabCount('#pubPageTabs .tab[data-ptab="pt-launch"]', "#launchBody");
    setTabCount('#ledgerTabs .tab[data-ltab="lt-task"]', "#lt-task");
    setTabCount('#ledgerTabs .tab[data-ltab="lt-inst"]', "#lt-inst");

    // 让各列表的查询条件和「共 N 条」把新加的行算进去。
    if (typeof fbApply === "function") {
      ["myExecTable", "myDoneTable", "myFwdTable", "pubLaunchTable", "lgTaskTable", "lgInstTable"].forEach(function (id) { fbApply(id); });
    }
  }

  // 任务选表单的弹窗里，把原有的「日常巡检记录表」对应到工作表里的《日常巡检表》。
  if (typeof FORM_CATS !== "undefined" && FORM_CATS[0] && FORM_CATS[0].forms[0]) FORM_CATS[0].forms[0].name = view.formName;

  // ---------------------------------------------------------------- 执行页：日常巡检表

  function fieldHtml(field, value, readonly) {
    var id = "insp_" + field.key;
    var label = esc(field.label) + (field.unit ? "（" + field.unit + "）" : "");
    var required = field.required && !readonly ? '<span class="required">*</span>' : "";
    var wide = field.type === "textarea" ? " full" : "";
    var control;
    if (readonly || field.auto) {
      var shown = value || (readonly ? "\u2014" : "");
      control = field.type === "textarea"
        ? '<textarea class="form-input" id="' + id + '" rows="2" readonly>' + esc(shown) + "</textarea>"
        : '<input class="form-input" id="' + id + '" readonly value="' + esc(shown) + '">';
    } else if (field.type === "select") {
      control = '<select class="form-input" id="' + id + '" data-insp="' + field.key + '">' + field.options.map(function (option) {
        return "<option" + (option === value ? " selected" : "") + ">" + esc(option) + "</option>";
      }).join("") + "</select>";
    } else if (field.type === "number") {
      control = '<input class="form-input" id="' + id + '" data-insp="' + field.key + '" type="number" min="0" step="any" inputmode="decimal" placeholder="请输入实测值">';
    } else {
      control = '<textarea class="form-input" id="' + id + '" data-insp="' + field.key + '" rows="2" maxlength="200" placeholder="' + esc(field.placeholder || "") + '"></textarea>';
    }
    var hint = field.hint && !readonly ? '<div class="form-hint" data-insp-hint="' + field.key + '" style="margin-top:6px;">' + esc(field.hint) + "</div>" : "";
    return '<div class="form-group' + wide + '"><label class="form-label">' + label + required + "</label>" + control + hint + "</div>";
  }

  function paintForm(inst, mode) {
    var readonly = mode === "view";
    if (readonly && !inst.values) return; // 尚未提交：保留原型的「尚未提交」提示
    var values = readonly ? inst.values : view.defaults;
    var fields = view.fields.filter(function (field) { return field.type !== "image"; });
    var html = '<div class="exec-block"><div class="exec-block-head"><i class="bi bi-pencil-square"></i> '
      + (readonly ? "提交内容" : "任务执行填写") + " · 《" + esc(view.formName) + "》"
      + (readonly ? "" : ' <span class="mut">（检测值超出正常范围，提交后会按预警规则自动触发预警）</span>') + "</div>";
    if (readonly) {
      html += '<div class="submit-line" style="margin-bottom:12px;"><i class="bi bi-person-check"></i><b>' + esc(view.user) + "</b><span>提交于 " + inst.submittedAt + " · 记录编号 " + esc(inst.recordId) + "</span></div>";
    }
    html += '<div class="modal-grid">' + fields.map(function (field) { return fieldHtml(field, values[field.key], readonly); }).join("") + "</div>";
    html += readonly
      ? '<div class="form-group"><label class="form-label">现场照片</label><div class="form-hint"><i class="bi bi-paperclip"></i> ' + esc(values.photos || "未上传") + "</div></div>"
      : '<div class="form-group"><label class="form-label">现场照片</label><input class="form-input" id="insp_photos" type="file" multiple accept="image/*"><div class="form-hint" style="margin-top:8px;"><i class="bi bi-info-circle"></i>支持上传多张现场照片</div></div>';
    document.getElementById("execFormArea").innerHTML = html + "</div>";

    if (!readonly) {
      var draft = EXEC_DRAFT[inst.id];
      if (draft) Object.keys(draft).forEach(function (key) { var el = document.getElementById(key); if (el && !el.readOnly) el.value = draft[key]; });
      view.fields.forEach(function (field) { if (field.type === "number") markRange(field.key); });
    }
  }

  // 数值超出正常范围时，把提示变成红色，方便填报人当场确认。是否超限由预警规则判定。
  function markRange(key) {
    var input = document.getElementById("insp_" + key);
    var hint = document.querySelector('[data-insp-hint="' + key + '"]');
    if (!input || !hint) return;
    var field = view.fields.filter(function (item) { return item.key === key; })[0];
    var over = host.exceeds(key, input.value);
    hint.textContent = over ? field.hint + "，当前值已超出正常范围" : field.hint;
    hint.style.color = over ? "var(--danger, #d0453a)" : "";
  }
  document.addEventListener("input", function (event) {
    var key = event.target && event.target.dataset ? event.target.dataset.insp : "";
    if (key) markRange(key);
  });

  var renderOriginal = window.renderExecPage;
  window.renderExecPage = function (row, mode) {
    renderOriginal.apply(this, arguments);
    var inst = instanceOfRow(row);
    if (inst) paintForm(inst, mode);
  };

  // 执行详情弹窗里的发起人，原型写死成了它自己的登录人；巡检任务按实际发起人显示。
  var infoOriginal = window.instInfoOf;
  window.instInfoOf = function (tid) {
    var info = infoOriginal.apply(this, arguments);
    if (info && byId[tid]) info.starter = view.task.initiator;
    return info;
  };

  // 查看 / 编辑计划页：原型只回填 PLAN_DEMO 里的部分字段，这里把巡检计划的发起人、工种、地点补上。
  var fillOriginal = window.fillTaskForm;
  var planFilled = false;
  window.fillTaskForm = function (tid) {
    fillOriginal.apply(this, arguments);
    var mine = tid === view.plan.id;
    if (mine || planFilled) {
      document.getElementById("pWork").value = mine ? view.task.workType : "";
      document.getElementById("pLocation").value = mine ? view.task.location : "";
    }
    if (mine) document.getElementById("pInitiator").value = view.task.initiator;
    planFilled = mine;
  };

  // 暂存时把巡检表里填的值一起存下来。
  var collectOriginal = window.collectExecDraft;
  window.collectExecDraft = function () {
    var draft = collectOriginal.apply(this, arguments);
    document.querySelectorAll("#execFormArea [data-insp]").forEach(function (el) { draft[el.id] = el.value; });
    return draft;
  };

  // 转办：记到场景数据里，列表按数据重画。
  var forwardOriginal = window.moveToForward;
  window.moveToForward = function (row, to) {
    var inst = instanceOfRow(row);
    if (!inst) return forwardOriginal.apply(this, arguments);
    delete INST_EVENTS[inst.id]; // 原型另记的一条转办留痕（署名是它自己的登录人），执行日志里已有，去掉重复
    host.forwardTask(inst.id, to);
    sync();
  };

  // ---------------------------------------------------------------- 提交

  function resultLine(icon, color, html) {
    return '<div style="display:flex;gap:10px;align-items:flex-start;padding:7px 0;font-size:13px;line-height:1.6;color:var(--text-primary);">'
      + '<i class="bi ' + icon + '" style="color:' + color + ';margin-top:2px;"></i><div>' + html + "</div></div>";
  }

  window.__inspectionGo = function (target) {
    closeModal();
    host.navigate(target);
  };

  function showResult(result) {
    var ok = "var(--verdigris, #2a8f6f)", warn = "var(--danger, #d0453a)";
    var body = resultLine("bi-check-circle-fill", ok, "任务「" + esc(name) + "」已完成，已移入「已执行」。")
      + resultLine("bi-check-circle-fill", ok, "《" + esc(view.formName) + "》已提交，记录编号 <b>" + esc(result.recordId) + "</b>。")
      + resultLine("bi-check-circle-fill", ok, "已自动发起《" + esc(view.flowName) + "》（" + esc(result.flowNumber) + "），当前节点：" + esc(result.flowNode) + "。");
    if (result.alerts.length) {
      body += resultLine("bi-exclamation-triangle-fill", warn, "触发 <b>" + result.alerts.length + "</b> 条预警，处理人：" + esc(view.user) + "<ul style=\"margin:6px 0 0;padding-left:18px;\">"
        + result.alerts.map(function (alert) {
          return "<li>" + esc(alert.level) + " · " + esc(alert.content) + "：" + esc(alert.item.name) + "实测 " + esc(alert.item.act) + "（阈值 " + esc(alert.item.judge) + " " + esc(alert.item.thr) + "）</li>";
        }).join("") + "</ul>");
    } else {
      body += resultLine("bi-check-circle-fill", ok, "各项检测值均在正常范围内，未触发预警。");
    }
    body += resultLine("bi-broadcast", "var(--text-secondary)", "以上过程已记录到「" + esc(view.feedNoName) + "」。");
    var foot = '<button class="btn btn-ghost btn-sm" onclick="closeModal()">关闭</button>';
    showModal('<i class="bi bi-send-check"></i> 巡检已提交', body, foot);
  }

  // 在捕获阶段先于原型自己的提交处理执行；只接管巡检任务，其它任务照旧。
  document.addEventListener("click", function (event) {
    if (!event.target.closest || !event.target.closest("#btnExecSubmit")) return;
    var inst = instanceOfRow(EXEC_ROW);
    if (!inst || inst.status !== "pending") return;
    event.stopPropagation();
    event.preventDefault();

    var raw = {};
    document.querySelectorAll("#execFormArea [data-insp]").forEach(function (el) { raw[el.dataset.insp] = el.value; });
    var photoInput = document.getElementById("insp_photos");
    raw.photos = photoInput ? Array.prototype.map.call(photoInput.files, function (file) { return file.name; }).join("、") : "";
    var checked = host.normalizeValues(raw);
    if (checked.error) {
      toast(checked.error, "err");
      var input = document.getElementById("insp_" + checked.field);
      if (input) input.focus();
      return;
    }
    var result = host.submitInspection(inst.id, checked.values);
    if (!result) { toast("这条任务已经提交过了", "err"); return; }
    delete EXEC_DRAFT[inst.id];
    EXEC_ROW = null;
    sync();
    switchView("view-mytask");
    activateMyTab("t-exec");
    showResult(result);
  }, true);

  sync();
})(window.__inspectionHost);
