// 低代码原型 · 流程中心模块里的桥接脚本，由 embed.js 注入到内层 iframe 中运行。
// 作用：加入绑定《日常巡检表》的「日常巡检审批流程」，实例监控里显示巡检发起的流程实例。
// 这里引用的 FORMS、FLOWS、FLOW_INSTANCES、nodeStart 等都是该模块自己的全局变量和函数。

(function (host) {
  "use strict";
  if (!host || typeof FLOWS === "undefined" || typeof nodeApproval !== "function") return;

  var view = host.views.lowcode();
  var flow = view.flow;

  if (!FORMS.some(function (form) { return form.id === view.form.id; })) {
    FORMS.push({
      id: view.form.id, name: view.form.name, icon: "fa-clipboard-check",
      fields: view.form.fields.map(function (field) { return { fieldName: field.fieldName, label: field.label }; })
    });
  }

  if (!FLOWS.some(function (item) { return item.id === flow.id; })) {
    var start = nodeStart();
    start.name = "巡检人提交";
    var approval = nodeApproval();
    approval.name = flow.approvalNode;
    approval.approverType = "member";
    approval.members = [flow.approver];
    approval.timeoutEnabled = true;
    var copy = nodeCC();
    copy.name = flow.ccNode;
    copy.members = [flow.ccMember];
    var nodes = [start, approval, copy, nodeEnd()];
    var edges = [];
    for (var i = 0; i < nodes.length - 1; i++) {
      edges.push({ id: "e_" + nodes[i].id + "_" + nodes[i + 1].id, from: nodes[i].id, to: nodes[i + 1].id, mode: "always", logic: "and", conditions: [] });
    }
    autoLayout(nodes);
    var base = {
      name: flow.name, desc: flow.description, icon: "fa-shield", formId: view.form.id,
      allowRecall: true, recallHours: 24, recallUnit: "hour"
    };
    FLOWS.unshift(Object.assign({}, base, {
      id: flow.id, category: "approval", status: "已发布", version: 1, hasUnpublished: false,
      publishedAt: flow.publishedAt, publishedBy: view.user, viewScope: "all", viewRoles: [],
      creator: view.user, createdAt: flow.createdAt, refs: flow.refs, printable: true, codeRule: "XJ-{yyyyMMdd}-{0000}",
      versions: [Object.assign({ v: 1, publishedAt: flow.publishedAt, publishedBy: view.user }, base, {
        nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges))
      })],
      nodes: nodes, edges: edges
    }));
  }

  for (var j = FLOW_INSTANCES.length - 1; j >= 0; j--) if (FLOW_INSTANCES[j].flowId === flow.id) FLOW_INSTANCES.splice(j, 1);
  view.instances.slice().reverse().forEach(function (instance) {
    FLOW_INSTANCES.unshift(instance);
    INSTANCE_FORM_DATA[instance.id] = instance.formData;
  });
})(window.__inspectionHost);
