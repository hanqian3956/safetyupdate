// 低代码原型 · 工作表单模块里的桥接脚本，由 embed.js 注入到内层 iframe 中运行。
// 作用：在表单列表里加入《日常巡检表》（含字段设计），「数据」里显示巡检提交记录。
// 这里引用的 SAMPLE_FORMS、CONTROL_DEFS、nid、ensureViews 等都是该模块自己的全局变量和函数。

(function (host) {
  "use strict";
  if (!host || typeof SAMPLE_FORMS === "undefined" || typeof CONTROL_DEFS === "undefined") return;

  var view = host.views.lowcode();
  var def = view.form;

  function toField(field) {
    var extra = {};
    if (field.options) {
      extra.source = "static";
      extra.options = field.options.map(function (option, index) { return { label: option, value: "opt" + (index + 1) }; });
      extra.defaultValue = "";
    }
    if (field.type === "number") { extra.unit = field.unit; extra.min = 0; extra.precision = 1; extra.showStepper = false; }
    if (field.type === "member") extra.defaultType = "currentUser";
    if (field.type === "datetime") extra.defaultType = "today";
    if (field.type === "image") extra.maxCount = 6;
    if (field.placeholder) extra.placeholder = field.placeholder;
    return Object.assign(
      {
        id: nid(), type: field.type, label: field.label, fieldName: field.fieldName, span: field.span, required: field.required, helpText: field.helpText,
        visible: { mode: "always", logic: "and", conditions: [{ field: "", op: "eq", value: "" }] }
      },
      CONTROL_DEFS[field.type].defaults(),
      extra
    );
  }

  if (!SAMPLE_FORMS.some(function (form) { return form.id === def.id; })) {
    var form = {
      id: def.id, name: def.name, status: "已发布", updatedAt: def.updatedAt, cat: def.category, creator: view.user, createdAt: def.createdAt, refs: def.refs,
      fc: {
        name: def.name, desc: def.description, icon: "fa-clipboard-check", category: def.category,
        submitScope: "all", submitDepts: [], submitRoles: [], allowDraft: true, allowMultiple: true, afterSubmit: "tip", afterUrl: "",
        dataVisible: "dept", dataDept: [], editScope: "creator", editDepts: [], editRoles: [],
        labelPos: "top", labelAlign: "left", labelWidth: "medium", formWidth: "standard", printable: true, showSubmitTime: true, dedupe: false
      },
      fields: def.fields.map(toField)
    };
    ensureViews(form);
    SAMPLE_FORMS.unshift(form);
  }
  SAMPLE_SUBMISSIONS[def.id] = view.submissions;
})(window.__inspectionHost);
