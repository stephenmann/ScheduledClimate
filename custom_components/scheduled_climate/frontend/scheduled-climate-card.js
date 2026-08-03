const M = globalThis, B = M.ShadowRoot && (M.ShadyCSS === void 0 || M.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, I = /* @__PURE__ */ Symbol(), Z = /* @__PURE__ */ new WeakMap();
let rt = class {
  constructor(t, e, i) {
    if (this._$cssResult$ = !0, i !== I) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const e = this.t;
    if (B && t === void 0) {
      const i = e !== void 0 && e.length === 1;
      i && (t = Z.get(e)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), i && Z.set(e, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const dt = (n) => new rt(typeof n == "string" ? n : n + "", void 0, I), nt = (n, ...t) => {
  const e = n.length === 1 ? n[0] : t.reduce((i, s, r) => i + ((a) => {
    if (a._$cssResult$ === !0) return a.cssText;
    if (typeof a == "number") return a;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + a + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s) + n[r + 1], n[0]);
  return new rt(e, n, I);
}, pt = (n, t) => {
  if (B) n.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
  else for (const e of t) {
    const i = document.createElement("style"), s = M.litNonce;
    s !== void 0 && i.setAttribute("nonce", s), i.textContent = e.cssText, n.appendChild(i);
  }
}, J = B ? (n) => n : (n) => n instanceof CSSStyleSheet ? ((t) => {
  let e = "";
  for (const i of t.cssRules) e += i.cssText;
  return dt(e);
})(n) : n;
const { is: ut, defineProperty: mt, getOwnPropertyDescriptor: _t, getOwnPropertyNames: gt, getOwnPropertySymbols: $t, getPrototypeOf: ft } = Object, z = globalThis, K = z.trustedTypes, bt = K ? K.emptyScript : "", yt = z.reactiveElementPolyfillSupport, E = (n, t) => n, D = { toAttribute(n, t) {
  switch (t) {
    case Boolean:
      n = n ? bt : null;
      break;
    case Object:
    case Array:
      n = n == null ? n : JSON.stringify(n);
  }
  return n;
}, fromAttribute(n, t) {
  let e = n;
  switch (t) {
    case Boolean:
      e = n !== null;
      break;
    case Number:
      e = n === null ? null : Number(n);
      break;
    case Object:
    case Array:
      try {
        e = JSON.parse(n);
      } catch {
        e = null;
      }
  }
  return e;
} }, at = (n, t) => !ut(n, t), G = { attribute: !0, type: String, converter: D, reflect: !1, useDefault: !1, hasChanged: at };
Symbol.metadata ??= /* @__PURE__ */ Symbol("metadata"), z.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let y = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ??= []).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, e = G) {
    if (e.state && (e.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((e = Object.create(e)).wrapped = !0), this.elementProperties.set(t, e), !e.noAccessor) {
      const i = /* @__PURE__ */ Symbol(), s = this.getPropertyDescriptor(t, i, e);
      s !== void 0 && mt(this.prototype, t, s);
    }
  }
  static getPropertyDescriptor(t, e, i) {
    const { get: s, set: r } = _t(this.prototype, t) ?? { get() {
      return this[e];
    }, set(a) {
      this[e] = a;
    } };
    return { get: s, set(a) {
      const h = s?.call(this);
      r?.call(this, a), this.requestUpdate(t, h, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? G;
  }
  static _$Ei() {
    if (this.hasOwnProperty(E("elementProperties"))) return;
    const t = ft(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(E("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(E("properties"))) {
      const e = this.properties, i = [...gt(e), ...$t(e)];
      for (const s of i) this.createProperty(s, e[s]);
    }
    const t = this[Symbol.metadata];
    if (t !== null) {
      const e = litPropertyMetadata.get(t);
      if (e !== void 0) for (const [i, s] of e) this.elementProperties.set(i, s);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [e, i] of this.elementProperties) {
      const s = this._$Eu(e, i);
      s !== void 0 && this._$Eh.set(s, e);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t) {
    const e = [];
    if (Array.isArray(t)) {
      const i = new Set(t.flat(1 / 0).reverse());
      for (const s of i) e.unshift(J(s));
    } else t !== void 0 && e.push(J(t));
    return e;
  }
  static _$Eu(t, e) {
    const i = e.attribute;
    return i === !1 ? void 0 : typeof i == "string" ? i : typeof t == "string" ? t.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((t) => this.enableUpdating = t), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t) => t(this));
  }
  addController(t) {
    (this._$EO ??= /* @__PURE__ */ new Set()).add(t), this.renderRoot !== void 0 && this.isConnected && t.hostConnected?.();
  }
  removeController(t) {
    this._$EO?.delete(t);
  }
  _$E_() {
    const t = /* @__PURE__ */ new Map(), e = this.constructor.elementProperties;
    for (const i of e.keys()) this.hasOwnProperty(i) && (t.set(i, this[i]), delete this[i]);
    t.size > 0 && (this._$Ep = t);
  }
  createRenderRoot() {
    const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return pt(t, this.constructor.elementStyles), t;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((t) => t.hostConnected?.());
  }
  enableUpdating(t) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((t) => t.hostDisconnected?.());
  }
  attributeChangedCallback(t, e, i) {
    this._$AK(t, i);
  }
  _$ET(t, e) {
    const i = this.constructor.elementProperties.get(t), s = this.constructor._$Eu(t, i);
    if (s !== void 0 && i.reflect === !0) {
      const r = (i.converter?.toAttribute !== void 0 ? i.converter : D).toAttribute(e, i.type);
      this._$Em = t, r == null ? this.removeAttribute(s) : this.setAttribute(s, r), this._$Em = null;
    }
  }
  _$AK(t, e) {
    const i = this.constructor, s = i._$Eh.get(t);
    if (s !== void 0 && this._$Em !== s) {
      const r = i.getPropertyOptions(s), a = typeof r.converter == "function" ? { fromAttribute: r.converter } : r.converter?.fromAttribute !== void 0 ? r.converter : D;
      this._$Em = s;
      const h = a.fromAttribute(e, r.type);
      this[s] = h ?? this._$Ej?.get(s) ?? h, this._$Em = null;
    }
  }
  requestUpdate(t, e, i, s = !1, r) {
    if (t !== void 0) {
      const a = this.constructor;
      if (s === !1 && (r = this[t]), i ??= a.getPropertyOptions(t), !((i.hasChanged ?? at)(r, e) || i.useDefault && i.reflect && r === this._$Ej?.get(t) && !this.hasAttribute(a._$Eu(t, i)))) return;
      this.C(t, e, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, e, { useDefault: i, reflect: s, wrapped: r }, a) {
    i && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t) && (this._$Ej.set(t, a ?? e ?? this[t]), r !== !0 || a !== void 0) || (this._$AL.has(t) || (this.hasUpdated || i || (e = void 0), this._$AL.set(t, e)), s === !0 && this._$Em !== t && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (e) {
      Promise.reject(e);
    }
    const t = this.scheduleUpdate();
    return t != null && await t, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
        for (const [s, r] of this._$Ep) this[s] = r;
        this._$Ep = void 0;
      }
      const i = this.constructor.elementProperties;
      if (i.size > 0) for (const [s, r] of i) {
        const { wrapped: a } = r, h = this[s];
        a !== !0 || this._$AL.has(s) || h === void 0 || this.C(s, void 0, r, h);
      }
    }
    let t = !1;
    const e = this._$AL;
    try {
      t = this.shouldUpdate(e), t ? (this.willUpdate(e), this._$EO?.forEach((i) => i.hostUpdate?.()), this.update(e)) : this._$EM();
    } catch (i) {
      throw t = !1, this._$EM(), i;
    }
    t && this._$AE(e);
  }
  willUpdate(t) {
  }
  _$AE(t) {
    this._$EO?.forEach((e) => e.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(t)), this.updated(t);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(t) {
    return !0;
  }
  update(t) {
    this._$Eq &&= this._$Eq.forEach((e) => this._$ET(e, this[e])), this._$EM();
  }
  updated(t) {
  }
  firstUpdated(t) {
  }
};
y.elementStyles = [], y.shadowRootOptions = { mode: "open" }, y[E("elementProperties")] = /* @__PURE__ */ new Map(), y[E("finalized")] = /* @__PURE__ */ new Map(), yt?.({ ReactiveElement: y }), (z.reactiveElementVersions ??= []).push("2.1.2");
const W = globalThis, Q = (n) => n, N = W.trustedTypes, X = N ? N.createPolicy("lit-html", { createHTML: (n) => n }) : void 0, ot = "$lit$", g = `lit$${Math.random().toFixed(9).slice(2)}$`, lt = "?" + g, vt = `<${lt}>`, b = document, C = () => b.createComment(""), T = (n) => n === null || typeof n != "object" && typeof n != "function", q = Array.isArray, xt = (n) => q(n) || typeof n?.[Symbol.iterator] == "function", L = `[ 	
\f\r]`, w = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Y = /-->/g, tt = />/g, $ = RegExp(`>|${L}(?:([^\\s"'>=/]+)(${L}*=${L}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), et = /'/g, it = /"/g, ct = /^(?:script|style|textarea|title)$/i, At = (n) => (t, ...e) => ({ _$litType$: n, strings: t, values: e }), p = At(1), x = /* @__PURE__ */ Symbol.for("lit-noChange"), c = /* @__PURE__ */ Symbol.for("lit-nothing"), st = /* @__PURE__ */ new WeakMap(), f = b.createTreeWalker(b, 129);
function ht(n, t) {
  if (!q(n) || !n.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return X !== void 0 ? X.createHTML(t) : t;
}
const wt = (n, t) => {
  const e = n.length - 1, i = [];
  let s, r = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", a = w;
  for (let h = 0; h < e; h++) {
    const o = n[h];
    let l, u, d = -1, m = 0;
    for (; m < o.length && (a.lastIndex = m, u = a.exec(o), u !== null); ) m = a.lastIndex, a === w ? u[1] === "!--" ? a = Y : u[1] !== void 0 ? a = tt : u[2] !== void 0 ? (ct.test(u[2]) && (s = RegExp("</" + u[2], "g")), a = $) : u[3] !== void 0 && (a = $) : a === $ ? u[0] === ">" ? (a = s ?? w, d = -1) : u[1] === void 0 ? d = -2 : (d = a.lastIndex - u[2].length, l = u[1], a = u[3] === void 0 ? $ : u[3] === '"' ? it : et) : a === it || a === et ? a = $ : a === Y || a === tt ? a = w : (a = $, s = void 0);
    const _ = a === $ && n[h + 1].startsWith("/>") ? " " : "";
    r += a === w ? o + vt : d >= 0 ? (i.push(l), o.slice(0, d) + ot + o.slice(d) + g + _) : o + g + (d === -2 ? h : _);
  }
  return [ht(n, r + (n[e] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), i];
};
class P {
  constructor({ strings: t, _$litType$: e }, i) {
    let s;
    this.parts = [];
    let r = 0, a = 0;
    const h = t.length - 1, o = this.parts, [l, u] = wt(t, e);
    if (this.el = P.createElement(l, i), f.currentNode = this.el.content, e === 2 || e === 3) {
      const d = this.el.content.firstChild;
      d.replaceWith(...d.childNodes);
    }
    for (; (s = f.nextNode()) !== null && o.length < h; ) {
      if (s.nodeType === 1) {
        if (s.hasAttributes()) for (const d of s.getAttributeNames()) if (d.endsWith(ot)) {
          const m = u[a++], _ = s.getAttribute(d).split(g), U = /([.?@])?(.*)/.exec(m);
          o.push({ type: 1, index: r, name: U[2], strings: _, ctor: U[1] === "." ? St : U[1] === "?" ? Ct : U[1] === "@" ? Tt : R }), s.removeAttribute(d);
        } else d.startsWith(g) && (o.push({ type: 6, index: r }), s.removeAttribute(d));
        if (ct.test(s.tagName)) {
          const d = s.textContent.split(g), m = d.length - 1;
          if (m > 0) {
            s.textContent = N ? N.emptyScript : "";
            for (let _ = 0; _ < m; _++) s.append(d[_], C()), f.nextNode(), o.push({ type: 2, index: ++r });
            s.append(d[m], C());
          }
        }
      } else if (s.nodeType === 8) if (s.data === lt) o.push({ type: 2, index: r });
      else {
        let d = -1;
        for (; (d = s.data.indexOf(g, d + 1)) !== -1; ) o.push({ type: 7, index: r }), d += g.length - 1;
      }
      r++;
    }
  }
  static createElement(t, e) {
    const i = b.createElement("template");
    return i.innerHTML = t, i;
  }
}
function A(n, t, e = n, i) {
  if (t === x) return t;
  let s = i !== void 0 ? e._$Co?.[i] : e._$Cl;
  const r = T(t) ? void 0 : t._$litDirective$;
  return s?.constructor !== r && (s?._$AO?.(!1), r === void 0 ? s = void 0 : (s = new r(n), s._$AT(n, e, i)), i !== void 0 ? (e._$Co ??= [])[i] = s : e._$Cl = s), s !== void 0 && (t = A(n, s._$AS(n, t.values), s, i)), t;
}
class Et {
  constructor(t, e) {
    this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = e;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t) {
    const { el: { content: e }, parts: i } = this._$AD, s = (t?.creationScope ?? b).importNode(e, !0);
    f.currentNode = s;
    let r = f.nextNode(), a = 0, h = 0, o = i[0];
    for (; o !== void 0; ) {
      if (a === o.index) {
        let l;
        o.type === 2 ? l = new k(r, r.nextSibling, this, t) : o.type === 1 ? l = new o.ctor(r, o.name, o.strings, this, t) : o.type === 6 && (l = new Pt(r, this, t)), this._$AV.push(l), o = i[++h];
      }
      a !== o?.index && (r = f.nextNode(), a++);
    }
    return f.currentNode = b, s;
  }
  p(t) {
    let e = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(t, i, e), e += i.strings.length - 2) : i._$AI(t[e])), e++;
  }
}
class k {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t, e, i, s) {
    this.type = 2, this._$AH = c, this._$AN = void 0, this._$AA = t, this._$AB = e, this._$AM = i, this.options = s, this._$Cv = s?.isConnected ?? !0;
  }
  get parentNode() {
    let t = this._$AA.parentNode;
    const e = this._$AM;
    return e !== void 0 && t?.nodeType === 11 && (t = e.parentNode), t;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t, e = this) {
    t = A(this, t, e), T(t) ? t === c || t == null || t === "" ? (this._$AH !== c && this._$AR(), this._$AH = c) : t !== this._$AH && t !== x && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : xt(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== c && T(this._$AH) ? this._$AA.nextSibling.data = t : this.T(b.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    const { values: e, _$litType$: i } = t, s = typeof i == "number" ? this._$AC(t) : (i.el === void 0 && (i.el = P.createElement(ht(i.h, i.h[0]), this.options)), i);
    if (this._$AH?._$AD === s) this._$AH.p(e);
    else {
      const r = new Et(s, this), a = r.u(this.options);
      r.p(e), this.T(a), this._$AH = r;
    }
  }
  _$AC(t) {
    let e = st.get(t.strings);
    return e === void 0 && st.set(t.strings, e = new P(t)), e;
  }
  k(t) {
    q(this._$AH) || (this._$AH = [], this._$AR());
    const e = this._$AH;
    let i, s = 0;
    for (const r of t) s === e.length ? e.push(i = new k(this.O(C()), this.O(C()), this, this.options)) : i = e[s], i._$AI(r), s++;
    s < e.length && (this._$AR(i && i._$AB.nextSibling, s), e.length = s);
  }
  _$AR(t = this._$AA.nextSibling, e) {
    for (this._$AP?.(!1, !0, e); t !== this._$AB; ) {
      const i = Q(t).nextSibling;
      Q(t).remove(), t = i;
    }
  }
  setConnected(t) {
    this._$AM === void 0 && (this._$Cv = t, this._$AP?.(t));
  }
}
class R {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, e, i, s, r) {
    this.type = 1, this._$AH = c, this._$AN = void 0, this.element = t, this.name = e, this._$AM = s, this.options = r, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = c;
  }
  _$AI(t, e = this, i, s) {
    const r = this.strings;
    let a = !1;
    if (r === void 0) t = A(this, t, e, 0), a = !T(t) || t !== this._$AH && t !== x, a && (this._$AH = t);
    else {
      const h = t;
      let o, l;
      for (t = r[0], o = 0; o < r.length - 1; o++) l = A(this, h[i + o], e, o), l === x && (l = this._$AH[o]), a ||= !T(l) || l !== this._$AH[o], l === c ? t = c : t !== c && (t += (l ?? "") + r[o + 1]), this._$AH[o] = l;
    }
    a && !s && this.j(t);
  }
  j(t) {
    t === c ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class St extends R {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === c ? void 0 : t;
  }
}
class Ct extends R {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== c);
  }
}
class Tt extends R {
  constructor(t, e, i, s, r) {
    super(t, e, i, s, r), this.type = 5;
  }
  _$AI(t, e = this) {
    if ((t = A(this, t, e, 0) ?? c) === x) return;
    const i = this._$AH, s = t === c && i !== c || t.capture !== i.capture || t.once !== i.once || t.passive !== i.passive, r = t !== c && (i === c || s);
    s && this.element.removeEventListener(this.name, this, i), r && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class Pt {
  constructor(t, e, i) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = e, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    A(this, t);
  }
}
const kt = W.litHtmlPolyfillSupport;
kt?.(P, k), (W.litHtmlVersions ??= []).push("3.3.3");
const Ut = (n, t, e) => {
  const i = e?.renderBefore ?? t;
  let s = i._$litPart$;
  if (s === void 0) {
    const r = e?.renderBefore ?? null;
    i._$litPart$ = s = new k(t.insertBefore(C(), r), r, void 0, e ?? {});
  }
  return s._$AI(n), s;
};
const F = globalThis;
class v extends y {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t.firstChild, t;
  }
  update(t) {
    const e = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = Ut(e, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return x;
  }
}
v._$litElement$ = !0, v.finalized = !0, F.litElementHydrateSupport?.({ LitElement: v });
const Mt = F.litElementPolyfillSupport;
Mt?.({ LitElement: v });
(F.litElementVersions ??= []).push("4.2.2");
const S = [15, 30, 60, 120], H = class H extends v {
  setConfig(t) {
    this._config = { ...t };
  }
  _setValue(t, e) {
    if (!this._config) return;
    const i = { ...this._config, [t]: e };
    this._config = i, this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: i },
        bubbles: !0,
        composed: !0
      })
    );
  }
  render() {
    if (!this.hass || !this._config) return c;
    const t = Object.values(this.hass.states).filter(
      (i) => i.entity_id.startsWith("climate.") && "schedule_enabled" in i.attributes
    ), e = (this._config.timer_presets ?? S).join(", ");
    return p`
      <div class="form">
        <label>
          Entity
          <select
            .value=${this._config.entity ?? ""}
            @change=${(i) => this._setValue("entity", i.target.value)}
          >
            <option value="" disabled>Select an entity</option>
            ${t.map(
      (i) => p`
                <option value=${i.entity_id}>
                  ${i.attributes.friendly_name ?? i.entity_id}
                </option>
              `
    )}
          </select>
        </label>
        <label>
          Card name
          <input
            type="text"
            .value=${this._config.name ?? ""}
            @input=${(i) => this._setValue("name", i.target.value)}
          />
        </label>
        <label class="toggle">
          <input
            type="checkbox"
            .checked=${this._config.show_schedule !== !1}
            @change=${(i) => this._setValue(
      "show_schedule",
      i.target.checked
    )}
          />
          Show schedule controls
        </label>
        <label class="toggle">
          <input
            type="checkbox"
            .checked=${this._config.show_timer !== !1}
            @change=${(i) => this._setValue(
      "show_timer",
      i.target.checked
    )}
          />
          Show timer controls
        </label>
        <label>
          Timer presets (minutes)
          <input
            type="text"
            .value=${e}
            @change=${(i) => {
      const s = i.target.value.split(",").map((r) => Number.parseInt(r.trim(), 10)).filter((r) => Number.isFinite(r) && r > 0);
      this._setValue("timer_presets", s.length ? s : S);
    }}
          />
        </label>
      </div>
    `;
  }
};
H.properties = {
  hass: { attribute: !1 },
  _config: { state: !0 }
}, H.styles = nt`
    :host { display: block; }
    .form { display: grid; gap: 16px; padding: 8px 0; }
    label { display: grid; gap: 6px; color: var(--primary-text-color); }
    .toggle { display: flex; align-items: center; gap: 10px; }
    input[type="checkbox"] { accent-color: var(--primary-color); }
    select, input[type="text"] {
      box-sizing: border-box;
      width: 100%;
      min-height: 42px;
      padding: 8px 10px;
      color: var(--primary-text-color);
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      font: inherit;
    }
  `;
let j = H;
customElements.define("scheduled-climate-card-editor", j);
const Nt = /* @__PURE__ */ new Set(["unavailable", "unknown"]), O = class O extends v {
  constructor() {
    super(...arguments), this._busy = !1, this._message = "", this._scheduleEnabled = !1, this._onTime = "", this._offTime = "", this._timerMinutes = 30, this._scheduleSignature = "";
  }
  static getConfigElement() {
    return document.createElement("scheduled-climate-card-editor");
  }
  static getStubConfig() {
    return {
      type: "custom:scheduled-climate-card",
      entity: "",
      show_schedule: !0,
      show_timer: !0,
      timer_presets: S
    };
  }
  setConfig(t) {
    if (!t.entity) throw new Error("Scheduled Climate Card requires an entity");
    this._config = {
      show_schedule: !0,
      show_timer: !0,
      timer_presets: S,
      ...t
    };
  }
  getCardSize() {
    return 7;
  }
  willUpdate() {
    const t = this._state;
    if (!t) return;
    const e = t.attributes, i = [
      e.schedule_enabled,
      e.schedule_on_time,
      e.schedule_off_time
    ].join("|");
    i !== this._scheduleSignature && (this._scheduleSignature = i, this._scheduleEnabled = !!e.schedule_enabled, this._onTime = this._shortTime(e.schedule_on_time), this._offTime = this._shortTime(e.schedule_off_time));
  }
  get _state() {
    return this._config && this.hass?.states[this._config.entity];
  }
  _shortTime(t) {
    return t ? t.slice(0, 5) : "";
  }
  async _call(t, e, i = {}) {
    if (!(!this.hass || !this._config || this._busy)) {
      this._busy = !0, this._message = "";
      try {
        await this.hass.callService(t, e, {
          entity_id: this._config.entity,
          ...i
        }), this._message = "Saved";
      } catch (s) {
        this._message = s instanceof Error ? s.message : "Command failed";
      } finally {
        this._busy = !1;
      }
    }
  }
  _formatValue(t, e = "") {
    return typeof t == "number" ? `${t}${e}` : "--";
  }
  _renderSelect(t, e, i, s, r) {
    return i?.length ? p`
      <label class="field">
        <span>${t}</span>
        <select
          .value=${e ?? ""}
          ?disabled=${this._busy}
          @change=${(a) => this._call("climate", s, {
      [r]: a.target.value
    })}
        >
          ${i.map((a) => p`<option value=${a}>${a.replaceAll("_", " ")}</option>`)}
        </select>
      </label>
    ` : c;
  }
  _renderClimate(t) {
    const e = t.attributes, i = String(e.unit_of_measurement ?? "°"), s = e.hvac_modes ?? [], r = e.temperature, a = e.target_temp_low, h = e.target_temp_high, o = e.target_temp_step ?? 0.5;
    return p`
      <section class="climate" aria-label="Climate controls">
        <div class="temperature">
          <div>
            <span class="current">${this._formatValue(e.current_temperature, i)}</span>
            <span class="caption">Current</span>
          </div>
          ${typeof r == "number" ? p`
                <label class="target">
                  <span class="caption">Target</span>
                  <input
                    type="number"
                    .value=${String(r)}
                    min=${e.min_temp ?? 7}
                    max=${e.max_temp ?? 35}
                    step=${o}
                    ?disabled=${this._busy}
                    @change=${(l) => this._call("climate", "set_temperature", {
      temperature: Number(l.target.value)
    })}
                  />
                  <span>${i}</span>
                </label>
              ` : typeof a == "number" && typeof h == "number" ? p`
                  <div class="range-target" aria-label="Target temperature range">
                    <label>
                      <span class="caption">Low</span>
                      <input
                        type="number"
                        .value=${String(a)}
                        min=${e.min_temp ?? 7}
                        max=${h}
                        step=${o}
                        ?disabled=${this._busy}
                        @change=${(l) => this._call("climate", "set_temperature", {
      target_temp_low: Number(l.target.value),
      target_temp_high: h
    })}
                      />
                    </label>
                    <span>–</span>
                    <label>
                      <span class="caption">High</span>
                      <input
                        type="number"
                        .value=${String(h)}
                        min=${a}
                        max=${e.max_temp ?? 35}
                        step=${o}
                        ?disabled=${this._busy}
                        @change=${(l) => this._call("climate", "set_temperature", {
      target_temp_low: a,
      target_temp_high: Number(l.target.value)
    })}
                      />
                    </label>
                    <span>${i}</span>
                  </div>
                ` : c}
        </div>
        ${e.hvac_action ? p`<div class="status"><span class="pulse"></span>${e.hvac_action.replaceAll("_", " ")}</div>` : c}
        <div class="modes" role="group" aria-label="HVAC mode">
          ${s.map(
      (l) => p`
              <button
                class=${t.state === l ? "selected" : ""}
                ?disabled=${this._busy}
                aria-pressed=${t.state === l}
                @click=${() => this._call("climate", "set_hvac_mode", { hvac_mode: l })}
              >${l.replaceAll("_", " ")}</button>
            `
    )}
        </div>
        <div class="control-grid">
          ${this._renderSelect("Preset", e.preset_mode, e.preset_modes, "set_preset_mode", "preset_mode")}
          ${this._renderSelect("Fan", e.fan_mode, e.fan_modes, "set_fan_mode", "fan_mode")}
          ${this._renderSelect("Swing", e.swing_mode, e.swing_modes, "set_swing_mode", "swing_mode")}
          ${this._renderSelect(
      "Horizontal swing",
      e.swing_horizontal_mode,
      e.swing_horizontal_modes,
      "set_swing_horizontal_mode",
      "swing_horizontal_mode"
    )}
          ${typeof e.humidity == "number" ? p`
                <label class="field">
                  <span>Humidity</span>
                  <input
                    type="number"
                    .value=${String(e.humidity)}
                    min=${e.min_humidity ?? 30}
                    max=${e.max_humidity ?? 99}
                    ?disabled=${this._busy}
                    @change=${(l) => this._call("climate", "set_humidity", {
      humidity: Number(l.target.value)
    })}
                  />
                </label>
              ` : c}
        </div>
      </section>
    `;
  }
  _renderSchedule(t) {
    const e = t.attributes.next_schedule_action, i = t.attributes.next_schedule_time;
    return p`
      <section aria-labelledby="schedule-heading">
        <div class="section-heading">
          <div>
            <h3 id="schedule-heading">Daily schedule</h3>
            <p>${e && i ? `Next ${e} · ${new Date(i).toLocaleString()}` : "No action scheduled"}</p>
          </div>
          <label class="switch">
            <input
              type="checkbox"
              .checked=${this._scheduleEnabled}
              @change=${(s) => this._scheduleEnabled = s.target.checked}
            />
            <span>Enabled</span>
          </label>
        </div>
        <div class="schedule-grid">
          <label class="field"><span>On time</span><input type="time" .value=${this._onTime} @input=${(s) => this._onTime = s.target.value} /></label>
          <label class="field"><span>Off time</span><input type="time" .value=${this._offTime} @input=${(s) => this._offTime = s.target.value} /></label>
          <button class="primary" ?disabled=${this._busy} @click=${() => this._call("scheduled_climate", "update_schedule", {
      schedule_enabled: this._scheduleEnabled,
      on_time: this._onTime || null,
      off_time: this._offTime || null
    })}><ha-icon icon="mdi:content-save-outline"></ha-icon>Save</button>
        </div>
      </section>
    `;
  }
  _renderTimer(t) {
    const e = t.attributes.timer_action, i = t.attributes.timer_deadline, s = this._config?.timer_presets ?? S;
    return p`
      <section aria-labelledby="timer-heading">
        <div class="section-heading">
          <div><h3 id="timer-heading">Timer</h3><p>${e && i ? `${e} at ${new Date(i).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "No active timer"}</p></div>
          ${e ? p`<button class="icon" title="Cancel timer" aria-label="Cancel timer" @click=${() => this._call("scheduled_climate", "cancel_timer")}><ha-icon icon="mdi:timer-off-outline"></ha-icon></button>` : c}
        </div>
        <div class="presets" aria-label="Timer presets">
          ${s.map((r) => p`<button class=${this._timerMinutes === r ? "selected" : ""} @click=${() => this._timerMinutes = r}>${r < 60 ? `${r}m` : `${r / 60}h`}</button>`)}
          <label class="custom-time"><span>Minutes</span><input type="number" min="1" step="1" .value=${String(this._timerMinutes)} @input=${(r) => this._timerMinutes = Math.max(1, Number(r.target.value))} /></label>
        </div>
        <div class="timer-actions">
          <button class="primary" ?disabled=${this._busy} @click=${() => this._startTimer("on")}><ha-icon icon="mdi:power"></ha-icon>Turn on later</button>
          <button ?disabled=${this._busy} @click=${() => this._startTimer("off")}><ha-icon icon="mdi:power-off"></ha-icon>Turn off later</button>
        </div>
      </section>
    `;
  }
  _startTimer(t) {
    const e = Math.round(this._timerMinutes * 60);
    this._call("scheduled_climate", `start_${t}_timer`, {
      duration: { seconds: e }
    });
  }
  render() {
    if (!this._config || !this.hass) return c;
    const t = this._state;
    if (!t) return p`<ha-card><div class="empty">Entity not found</div></ha-card>`;
    const e = Nt.has(t.state), i = this._config.name ?? t.attributes.friendly_name ?? "Scheduled Climate";
    return p`
      <ha-card>
        <header><div><h2>${i}</h2><p>${e ? "Unavailable" : t.state.replaceAll("_", " ")}</p></div><ha-icon icon="mdi:thermostat"></ha-icon></header>
        ${e ? p`<div class="empty">The climate entity is unavailable.</div>` : this._renderClimate(t)}
        ${!e && this._config.show_schedule !== !1 ? this._renderSchedule(t) : c}
        ${!e && this._config.show_timer !== !1 ? this._renderTimer(t) : c}
        ${this._message ? p`<div class="message" role="status">${this._message}</div>` : c}
      </ha-card>
    `;
  }
};
O.properties = {
  hass: { attribute: !1 },
  _config: { state: !0 },
  _busy: { state: !0 },
  _message: { state: !0 },
  _scheduleEnabled: { state: !0 },
  _onTime: { state: !0 },
  _offTime: { state: !0 },
  _timerMinutes: { state: !0 }
}, O.styles = nt`
    :host { display: block; color: var(--primary-text-color); }
    ha-card { overflow: hidden; border-radius: var(--ha-card-border-radius, 8px); }
    header, section { padding: 18px 20px; }
    header { display: flex; justify-content: space-between; align-items: center; background: color-mix(in srgb, var(--primary-color) 10%, var(--card-background-color)); border-bottom: 1px solid var(--divider-color); }
    header ha-icon { --mdc-icon-size: 34px; color: var(--primary-color); }
    h2, h3, p { margin: 0; letter-spacing: 0; }
    h2 { font-size: 20px; line-height: 1.3; }
    h3 { font-size: 15px; line-height: 1.4; }
    p, .caption, .field > span, .custom-time > span { color: var(--secondary-text-color); font-size: 12px; }
    section + section { border-top: 1px solid var(--divider-color); }
    .temperature { display: flex; justify-content: space-between; align-items: end; gap: 20px; }
    .temperature > div { display: grid; }
    .current { font-size: 38px; line-height: 1; font-weight: 500; }
    .target { display: flex; align-items: center; gap: 6px; }
    .target .caption { margin-right: 4px; }
    .target input { width: 70px; font-size: 20px; font-weight: 500; text-align: right; }
    .range-target { display: flex; align-items: end; gap: 6px; }
    .range-target label { display: grid; gap: 3px; }
    .range-target input { width: 62px; text-align: right; }
    .status { display: flex; align-items: center; gap: 7px; margin-top: 12px; color: var(--secondary-text-color); font-size: 13px; text-transform: capitalize; }
    .pulse { width: 7px; height: 7px; border-radius: 50%; background: var(--state-climate-heat-color, var(--primary-color)); }
    .modes, .presets { display: flex; gap: 6px; overflow-x: auto; margin-top: 16px; padding-bottom: 2px; }
    button { min-height: 38px; padding: 8px 12px; border: 1px solid var(--divider-color); border-radius: 6px; color: var(--primary-text-color); background: var(--card-background-color); font: inherit; cursor: pointer; text-transform: capitalize; white-space: nowrap; }
    button:hover { background: color-mix(in srgb, var(--primary-color) 8%, var(--card-background-color)); }
    button:focus-visible, input:focus-visible, select:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
    button.selected, button.primary { color: var(--text-primary-color, white); background: var(--primary-color); border-color: var(--primary-color); }
    button:disabled { opacity: .55; cursor: wait; }
    button ha-icon { --mdc-icon-size: 18px; margin-right: 6px; vertical-align: -4px; }
    .control-grid, .schedule-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 16px; }
    .field { display: grid; gap: 5px; }
    input, select { box-sizing: border-box; min-width: 0; min-height: 40px; padding: 7px 9px; color: var(--primary-text-color); background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 4px; font: inherit; }
    input[type="checkbox"] { accent-color: var(--primary-color); }
    .section-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .section-heading p { margin-top: 3px; }
    .switch { display: flex; align-items: center; gap: 7px; font-size: 13px; }
    .schedule-grid .primary { align-self: end; }
    .icon { width: 40px; padding: 7px; }
    .icon ha-icon { margin: 0; }
    .custom-time { display: flex; align-items: center; gap: 6px; margin-left: auto; }
    .custom-time input { width: 68px; }
    .timer-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 14px; }
    .message { padding: 10px 20px; border-top: 1px solid var(--divider-color); color: var(--secondary-text-color); font-size: 13px; }
    .empty { padding: 28px 20px; color: var(--secondary-text-color); text-align: center; }
    @media (max-width: 420px) {
      header, section { padding: 16px; }
      .control-grid, .schedule-grid { grid-template-columns: 1fr; }
      .timer-actions { grid-template-columns: 1fr; }
      .temperature { align-items: center; }
      .current { font-size: 32px; }
      .custom-time { margin-left: 0; }
    }
  `;
let V = O;
customElements.define("scheduled-climate-card", V);
window.customCards = window.customCards ?? [];
window.customCards.push({
  type: "scheduled-climate-card",
  name: "Scheduled Climate Card",
  description: "Climate controls with daily schedules and one-shot timers.",
  preview: !0
});
export {
  V as ScheduledClimateCard
};
