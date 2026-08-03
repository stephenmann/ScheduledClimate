const M = globalThis, B = M.ShadowRoot && (M.ShadyCSS === void 0 || M.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, I = /* @__PURE__ */ Symbol(), Z = /* @__PURE__ */ new WeakMap();
let re = class {
  constructor(e, t, i) {
    if (this._$cssResult$ = !0, i !== I) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (B && e === void 0) {
      const i = t !== void 0 && t.length === 1;
      i && (e = Z.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), i && Z.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const de = (n) => new re(typeof n == "string" ? n : n + "", void 0, I), ne = (n, ...e) => {
  const t = n.length === 1 ? n[0] : e.reduce((i, s, r) => i + ((a) => {
    if (a._$cssResult$ === !0) return a.cssText;
    if (typeof a == "number") return a;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + a + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s) + n[r + 1], n[0]);
  return new re(t, n, I);
}, pe = (n, e) => {
  if (B) n.adoptedStyleSheets = e.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
  else for (const t of e) {
    const i = document.createElement("style"), s = M.litNonce;
    s !== void 0 && i.setAttribute("nonce", s), i.textContent = t.cssText, n.appendChild(i);
  }
}, J = B ? (n) => n : (n) => n instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const i of e.cssRules) t += i.cssText;
  return de(t);
})(n) : n;
const { is: ue, defineProperty: me, getOwnPropertyDescriptor: _e, getOwnPropertyNames: ge, getOwnPropertySymbols: $e, getPrototypeOf: fe } = Object, z = globalThis, K = z.trustedTypes, be = K ? K.emptyScript : "", ye = z.reactiveElementPolyfillSupport, E = (n, e) => n, D = { toAttribute(n, e) {
  switch (e) {
    case Boolean:
      n = n ? be : null;
      break;
    case Object:
    case Array:
      n = n == null ? n : JSON.stringify(n);
  }
  return n;
}, fromAttribute(n, e) {
  let t = n;
  switch (e) {
    case Boolean:
      t = n !== null;
      break;
    case Number:
      t = n === null ? null : Number(n);
      break;
    case Object:
    case Array:
      try {
        t = JSON.parse(n);
      } catch {
        t = null;
      }
  }
  return t;
} }, ae = (n, e) => !ue(n, e), G = { attribute: !0, type: String, converter: D, reflect: !1, useDefault: !1, hasChanged: ae };
Symbol.metadata ??= /* @__PURE__ */ Symbol("metadata"), z.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let y = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ??= []).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = G) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
      const i = /* @__PURE__ */ Symbol(), s = this.getPropertyDescriptor(e, i, t);
      s !== void 0 && me(this.prototype, e, s);
    }
  }
  static getPropertyDescriptor(e, t, i) {
    const { get: s, set: r } = _e(this.prototype, e) ?? { get() {
      return this[t];
    }, set(a) {
      this[t] = a;
    } };
    return { get: s, set(a) {
      const h = s?.call(this);
      r?.call(this, a), this.requestUpdate(e, h, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? G;
  }
  static _$Ei() {
    if (this.hasOwnProperty(E("elementProperties"))) return;
    const e = fe(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(E("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(E("properties"))) {
      const t = this.properties, i = [...ge(t), ...$e(t)];
      for (const s of i) this.createProperty(s, t[s]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const t = litPropertyMetadata.get(e);
      if (t !== void 0) for (const [i, s] of t) this.elementProperties.set(i, s);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t, i] of this.elementProperties) {
      const s = this._$Eu(t, i);
      s !== void 0 && this._$Eh.set(s, t);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const t = [];
    if (Array.isArray(e)) {
      const i = new Set(e.flat(1 / 0).reverse());
      for (const s of i) t.unshift(J(s));
    } else e !== void 0 && t.push(J(e));
    return t;
  }
  static _$Eu(e, t) {
    const i = t.attribute;
    return i === !1 ? void 0 : typeof i == "string" ? i : typeof e == "string" ? e.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((e) => this.enableUpdating = e), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((e) => e(this));
  }
  addController(e) {
    (this._$EO ??= /* @__PURE__ */ new Set()).add(e), this.renderRoot !== void 0 && this.isConnected && e.hostConnected?.();
  }
  removeController(e) {
    this._$EO?.delete(e);
  }
  _$E_() {
    const e = /* @__PURE__ */ new Map(), t = this.constructor.elementProperties;
    for (const i of t.keys()) this.hasOwnProperty(i) && (e.set(i, this[i]), delete this[i]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return pe(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((e) => e.hostConnected?.());
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((e) => e.hostDisconnected?.());
  }
  attributeChangedCallback(e, t, i) {
    this._$AK(e, i);
  }
  _$ET(e, t) {
    const i = this.constructor.elementProperties.get(e), s = this.constructor._$Eu(e, i);
    if (s !== void 0 && i.reflect === !0) {
      const r = (i.converter?.toAttribute !== void 0 ? i.converter : D).toAttribute(t, i.type);
      this._$Em = e, r == null ? this.removeAttribute(s) : this.setAttribute(s, r), this._$Em = null;
    }
  }
  _$AK(e, t) {
    const i = this.constructor, s = i._$Eh.get(e);
    if (s !== void 0 && this._$Em !== s) {
      const r = i.getPropertyOptions(s), a = typeof r.converter == "function" ? { fromAttribute: r.converter } : r.converter?.fromAttribute !== void 0 ? r.converter : D;
      this._$Em = s;
      const h = a.fromAttribute(t, r.type);
      this[s] = h ?? this._$Ej?.get(s) ?? h, this._$Em = null;
    }
  }
  requestUpdate(e, t, i, s = !1, r) {
    if (e !== void 0) {
      const a = this.constructor;
      if (s === !1 && (r = this[e]), i ??= a.getPropertyOptions(e), !((i.hasChanged ?? ae)(r, t) || i.useDefault && i.reflect && r === this._$Ej?.get(e) && !this.hasAttribute(a._$Eu(e, i)))) return;
      this.C(e, t, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, t, { useDefault: i, reflect: s, wrapped: r }, a) {
    i && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, a ?? t ?? this[e]), r !== !0 || a !== void 0) || (this._$AL.has(e) || (this.hasUpdated || i || (t = void 0), this._$AL.set(e, t)), s === !0 && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (t) {
      Promise.reject(t);
    }
    const e = this.scheduleUpdate();
    return e != null && await e, !this.isUpdatePending;
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
    let e = !1;
    const t = this._$AL;
    try {
      e = this.shouldUpdate(t), e ? (this.willUpdate(t), this._$EO?.forEach((i) => i.hostUpdate?.()), this.update(t)) : this._$EM();
    } catch (i) {
      throw e = !1, this._$EM(), i;
    }
    e && this._$AE(t);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    this._$EO?.forEach((t) => t.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
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
  shouldUpdate(e) {
    return !0;
  }
  update(e) {
    this._$Eq &&= this._$Eq.forEach((t) => this._$ET(t, this[t])), this._$EM();
  }
  updated(e) {
  }
  firstUpdated(e) {
  }
};
y.elementStyles = [], y.shadowRootOptions = { mode: "open" }, y[E("elementProperties")] = /* @__PURE__ */ new Map(), y[E("finalized")] = /* @__PURE__ */ new Map(), ye?.({ ReactiveElement: y }), (z.reactiveElementVersions ??= []).push("2.1.2");
const W = globalThis, Q = (n) => n, N = W.trustedTypes, X = N ? N.createPolicy("lit-html", { createHTML: (n) => n }) : void 0, oe = "$lit$", g = `lit$${Math.random().toFixed(9).slice(2)}$`, le = "?" + g, ve = `<${le}>`, b = document, T = () => b.createComment(""), C = (n) => n === null || typeof n != "object" && typeof n != "function", q = Array.isArray, xe = (n) => q(n) || typeof n?.[Symbol.iterator] == "function", L = `[ 	
\f\r]`, w = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Y = /-->/g, ee = />/g, $ = RegExp(`>|${L}(?:([^\\s"'>=/]+)(${L}*=${L}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), te = /'/g, ie = /"/g, ce = /^(?:script|style|textarea|title)$/i, Ae = (n) => (e, ...t) => ({ _$litType$: n, strings: e, values: t }), p = Ae(1), x = /* @__PURE__ */ Symbol.for("lit-noChange"), c = /* @__PURE__ */ Symbol.for("lit-nothing"), se = /* @__PURE__ */ new WeakMap(), f = b.createTreeWalker(b, 129);
function he(n, e) {
  if (!q(n) || !n.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return X !== void 0 ? X.createHTML(e) : e;
}
const we = (n, e) => {
  const t = n.length - 1, i = [];
  let s, r = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", a = w;
  for (let h = 0; h < t; h++) {
    const o = n[h];
    let l, u, d = -1, m = 0;
    for (; m < o.length && (a.lastIndex = m, u = a.exec(o), u !== null); ) m = a.lastIndex, a === w ? u[1] === "!--" ? a = Y : u[1] !== void 0 ? a = ee : u[2] !== void 0 ? (ce.test(u[2]) && (s = RegExp("</" + u[2], "g")), a = $) : u[3] !== void 0 && (a = $) : a === $ ? u[0] === ">" ? (a = s ?? w, d = -1) : u[1] === void 0 ? d = -2 : (d = a.lastIndex - u[2].length, l = u[1], a = u[3] === void 0 ? $ : u[3] === '"' ? ie : te) : a === ie || a === te ? a = $ : a === Y || a === ee ? a = w : (a = $, s = void 0);
    const _ = a === $ && n[h + 1].startsWith("/>") ? " " : "";
    r += a === w ? o + ve : d >= 0 ? (i.push(l), o.slice(0, d) + oe + o.slice(d) + g + _) : o + g + (d === -2 ? h : _);
  }
  return [he(n, r + (n[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), i];
};
class P {
  constructor({ strings: e, _$litType$: t }, i) {
    let s;
    this.parts = [];
    let r = 0, a = 0;
    const h = e.length - 1, o = this.parts, [l, u] = we(e, t);
    if (this.el = P.createElement(l, i), f.currentNode = this.el.content, t === 2 || t === 3) {
      const d = this.el.content.firstChild;
      d.replaceWith(...d.childNodes);
    }
    for (; (s = f.nextNode()) !== null && o.length < h; ) {
      if (s.nodeType === 1) {
        if (s.hasAttributes()) for (const d of s.getAttributeNames()) if (d.endsWith(oe)) {
          const m = u[a++], _ = s.getAttribute(d).split(g), U = /([.?@])?(.*)/.exec(m);
          o.push({ type: 1, index: r, name: U[2], strings: _, ctor: U[1] === "." ? Se : U[1] === "?" ? Te : U[1] === "@" ? Ce : R }), s.removeAttribute(d);
        } else d.startsWith(g) && (o.push({ type: 6, index: r }), s.removeAttribute(d));
        if (ce.test(s.tagName)) {
          const d = s.textContent.split(g), m = d.length - 1;
          if (m > 0) {
            s.textContent = N ? N.emptyScript : "";
            for (let _ = 0; _ < m; _++) s.append(d[_], T()), f.nextNode(), o.push({ type: 2, index: ++r });
            s.append(d[m], T());
          }
        }
      } else if (s.nodeType === 8) if (s.data === le) o.push({ type: 2, index: r });
      else {
        let d = -1;
        for (; (d = s.data.indexOf(g, d + 1)) !== -1; ) o.push({ type: 7, index: r }), d += g.length - 1;
      }
      r++;
    }
  }
  static createElement(e, t) {
    const i = b.createElement("template");
    return i.innerHTML = e, i;
  }
}
function A(n, e, t = n, i) {
  if (e === x) return e;
  let s = i !== void 0 ? t._$Co?.[i] : t._$Cl;
  const r = C(e) ? void 0 : e._$litDirective$;
  return s?.constructor !== r && (s?._$AO?.(!1), r === void 0 ? s = void 0 : (s = new r(n), s._$AT(n, t, i)), i !== void 0 ? (t._$Co ??= [])[i] = s : t._$Cl = s), s !== void 0 && (e = A(n, s._$AS(n, e.values), s, i)), e;
}
class Ee {
  constructor(e, t) {
    this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = t;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(e) {
    const { el: { content: t }, parts: i } = this._$AD, s = (e?.creationScope ?? b).importNode(t, !0);
    f.currentNode = s;
    let r = f.nextNode(), a = 0, h = 0, o = i[0];
    for (; o !== void 0; ) {
      if (a === o.index) {
        let l;
        o.type === 2 ? l = new k(r, r.nextSibling, this, e) : o.type === 1 ? l = new o.ctor(r, o.name, o.strings, this, e) : o.type === 6 && (l = new Pe(r, this, e)), this._$AV.push(l), o = i[++h];
      }
      a !== o?.index && (r = f.nextNode(), a++);
    }
    return f.currentNode = b, s;
  }
  p(e) {
    let t = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(e, i, t), t += i.strings.length - 2) : i._$AI(e[t])), t++;
  }
}
class k {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(e, t, i, s) {
    this.type = 2, this._$AH = c, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = i, this.options = s, this._$Cv = s?.isConnected ?? !0;
  }
  get parentNode() {
    let e = this._$AA.parentNode;
    const t = this._$AM;
    return t !== void 0 && e?.nodeType === 11 && (e = t.parentNode), e;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(e, t = this) {
    e = A(this, e, t), C(e) ? e === c || e == null || e === "" ? (this._$AH !== c && this._$AR(), this._$AH = c) : e !== this._$AH && e !== x && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : xe(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== c && C(this._$AH) ? this._$AA.nextSibling.data = e : this.T(b.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    const { values: t, _$litType$: i } = e, s = typeof i == "number" ? this._$AC(e) : (i.el === void 0 && (i.el = P.createElement(he(i.h, i.h[0]), this.options)), i);
    if (this._$AH?._$AD === s) this._$AH.p(t);
    else {
      const r = new Ee(s, this), a = r.u(this.options);
      r.p(t), this.T(a), this._$AH = r;
    }
  }
  _$AC(e) {
    let t = se.get(e.strings);
    return t === void 0 && se.set(e.strings, t = new P(e)), t;
  }
  k(e) {
    q(this._$AH) || (this._$AH = [], this._$AR());
    const t = this._$AH;
    let i, s = 0;
    for (const r of e) s === t.length ? t.push(i = new k(this.O(T()), this.O(T()), this, this.options)) : i = t[s], i._$AI(r), s++;
    s < t.length && (this._$AR(i && i._$AB.nextSibling, s), t.length = s);
  }
  _$AR(e = this._$AA.nextSibling, t) {
    for (this._$AP?.(!1, !0, t); e !== this._$AB; ) {
      const i = Q(e).nextSibling;
      Q(e).remove(), e = i;
    }
  }
  setConnected(e) {
    this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
  }
}
class R {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, t, i, s, r) {
    this.type = 1, this._$AH = c, this._$AN = void 0, this.element = e, this.name = t, this._$AM = s, this.options = r, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = c;
  }
  _$AI(e, t = this, i, s) {
    const r = this.strings;
    let a = !1;
    if (r === void 0) e = A(this, e, t, 0), a = !C(e) || e !== this._$AH && e !== x, a && (this._$AH = e);
    else {
      const h = e;
      let o, l;
      for (e = r[0], o = 0; o < r.length - 1; o++) l = A(this, h[i + o], t, o), l === x && (l = this._$AH[o]), a ||= !C(l) || l !== this._$AH[o], l === c ? e = c : e !== c && (e += (l ?? "") + r[o + 1]), this._$AH[o] = l;
    }
    a && !s && this.j(e);
  }
  j(e) {
    e === c ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class Se extends R {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === c ? void 0 : e;
  }
}
class Te extends R {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== c);
  }
}
class Ce extends R {
  constructor(e, t, i, s, r) {
    super(e, t, i, s, r), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = A(this, e, t, 0) ?? c) === x) return;
    const i = this._$AH, s = e === c && i !== c || e.capture !== i.capture || e.once !== i.once || e.passive !== i.passive, r = e !== c && (i === c || s);
    s && this.element.removeEventListener(this.name, this, i), r && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class Pe {
  constructor(e, t, i) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    A(this, e);
  }
}
const ke = W.litHtmlPolyfillSupport;
ke?.(P, k), (W.litHtmlVersions ??= []).push("3.3.3");
const Ue = (n, e, t) => {
  const i = t?.renderBefore ?? e;
  let s = i._$litPart$;
  if (s === void 0) {
    const r = t?.renderBefore ?? null;
    i._$litPart$ = s = new k(e.insertBefore(T(), r), r, void 0, t ?? {});
  }
  return s._$AI(n), s;
};
const F = globalThis;
class v extends y {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const e = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= e.firstChild, e;
  }
  update(e) {
    const t = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Ue(t, this.renderRoot, this.renderOptions);
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
const Me = F.litElementPolyfillSupport;
Me?.({ LitElement: v });
(F.litElementVersions ??= []).push("4.2.2");
const S = [15, 30, 60, 120], O = class O extends v {
  setConfig(e) {
    this._config = { ...e };
  }
  _setValue(e, t) {
    if (!this._config) return;
    const i = { ...this._config, [e]: t };
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
    const e = Object.values(this.hass.states).filter(
      (i) => i.entity_id.startsWith("climate.") && "schedule_enabled" in i.attributes
    ), t = (this._config.timer_presets ?? S).join(", ");
    return p`
      <div class="form">
        <label>
          Entity
          <select
            .value=${this._config.entity ?? ""}
            @change=${(i) => this._setValue("entity", i.target.value)}
          >
            <option value="" disabled>Select an entity</option>
            ${e.map(
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
            .value=${t}
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
O.properties = {
  hass: { attribute: !1 },
  _config: { state: !0 }
}, O.styles = ne`
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
let j = O;
customElements.define("scheduled-climate-card-editor", j);
const Ne = /* @__PURE__ */ new Set(["unavailable", "unknown"]), H = class H extends v {
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
  setConfig(e) {
    if (!e.entity) throw new Error("Scheduled Climate Card requires an entity");
    this._config = {
      show_schedule: !0,
      show_timer: !0,
      timer_presets: S,
      ...e
    };
  }
  getCardSize() {
    return 7;
  }
  willUpdate() {
    const e = this._state;
    if (!e) return;
    const t = e.attributes, i = [
      t.schedule_enabled,
      t.schedule_on_time,
      t.schedule_off_time
    ].join("|");
    i !== this._scheduleSignature && (this._scheduleSignature = i, this._scheduleEnabled = !!t.schedule_enabled, this._onTime = this._shortTime(t.schedule_on_time), this._offTime = this._shortTime(t.schedule_off_time));
  }
  get _state() {
    return this._config && this.hass?.states[this._config.entity];
  }
  _shortTime(e) {
    return e ? e.slice(0, 5) : "";
  }
  async _call(e, t, i = {}) {
    if (!this.hass || !this._config || this._busy) return !1;
    this._busy = !0, this._message = "";
    try {
      return await this.hass.callService(e, t, {
        entity_id: this._config.entity,
        ...i
      }), this._message = "Saved", !0;
    } catch (s) {
      return this._message = s instanceof Error ? s.message : "Command failed", !1;
    } finally {
      this._busy = !1;
    }
  }
  _formatValue(e, t = "") {
    return typeof e == "number" ? `${e}${t}` : "--";
  }
  _renderSelect(e, t, i, s, r) {
    return i?.length ? p`
      <label class="field">
        <span>${e}</span>
        <select
          .value=${t ?? ""}
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
  _renderClimate(e) {
    const t = e.attributes, i = String(t.unit_of_measurement ?? "°"), s = t.hvac_modes ?? [], r = t.temperature, a = t.target_temp_low, h = t.target_temp_high, o = t.target_temp_step ?? 0.5;
    return p`
      <section class="climate" aria-label="Climate controls">
        <div class="temperature">
          <div>
            <span class="current">${this._formatValue(t.current_temperature, i)}</span>
            <span class="caption">Current</span>
          </div>
          ${typeof r == "number" ? p`
                <label class="target">
                  <span class="caption">Target</span>
                  <input
                    type="number"
                    .value=${String(r)}
                    min=${t.min_temp ?? 7}
                    max=${t.max_temp ?? 35}
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
                        min=${t.min_temp ?? 7}
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
                        max=${t.max_temp ?? 35}
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
        ${t.hvac_action ? p`<div class="status"><span class="pulse"></span>${t.hvac_action.replaceAll("_", " ")}</div>` : c}
        <div class="modes" role="group" aria-label="HVAC mode">
          ${s.map(
      (l) => p`
              <button
                class=${e.state === l ? "selected" : ""}
                ?disabled=${this._busy}
                aria-pressed=${e.state === l}
                @click=${() => this._call("climate", "set_hvac_mode", { hvac_mode: l })}
              >${l.replaceAll("_", " ")}</button>
            `
    )}
        </div>
        <div class="control-grid">
          ${this._renderSelect("Preset", t.preset_mode, t.preset_modes, "set_preset_mode", "preset_mode")}
          ${this._renderSelect("Fan", t.fan_mode, t.fan_modes, "set_fan_mode", "fan_mode")}
          ${this._renderSelect("Swing", t.swing_mode, t.swing_modes, "set_swing_mode", "swing_mode")}
          ${this._renderSelect(
      "Horizontal swing",
      t.swing_horizontal_mode,
      t.swing_horizontal_modes,
      "set_swing_horizontal_mode",
      "swing_horizontal_mode"
    )}
          ${typeof t.humidity == "number" ? p`
                <label class="field">
                  <span>Humidity</span>
                  <input
                    type="number"
                    .value=${String(t.humidity)}
                    min=${t.min_humidity ?? 30}
                    max=${t.max_humidity ?? 99}
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
  _renderSchedule(e) {
    const t = this._scheduleEnabled ? e.attributes.next_schedule_action : null, i = this._scheduleEnabled ? e.attributes.next_schedule_time : null;
    return p`
      <section aria-labelledby="schedule-heading">
        <div class="section-heading">
          <div>
            <h3 id="schedule-heading">Daily schedule</h3>
            <p>${t && i ? `Next ${t} · ${new Date(i).toLocaleString()}` : "No action scheduled"}</p>
          </div>
          <label class="switch">
            <input
              type="checkbox"
              .checked=${this._scheduleEnabled}
              ?disabled=${this._busy}
              @change=${(s) => this._scheduleEnabledChanged(
      s.target.checked
    )}
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
  async _scheduleEnabledChanged(e) {
    const t = this._onTime, i = this._offTime;
    this._scheduleEnabled = e, !e && (this._onTime = "", this._offTime = "", await this._call("scheduled_climate", "update_schedule", {
      schedule_enabled: !1,
      on_time: null,
      off_time: null
    }) || (this._scheduleEnabled = !0, this._onTime = t, this._offTime = i));
  }
  _renderTimer(e) {
    const t = e.attributes.timer_action, i = e.attributes.timer_deadline, s = this._config?.timer_presets ?? S;
    return p`
      <section aria-labelledby="timer-heading">
        <div class="section-heading">
          <div><h3 id="timer-heading">Timer</h3><p>${t && i ? `${t} at ${new Date(i).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "No active timer"}</p></div>
          ${t ? p`<button class="icon" title="Cancel timer" aria-label="Cancel timer" @click=${() => this._call("scheduled_climate", "cancel_timer")}><ha-icon icon="mdi:timer-off-outline"></ha-icon></button>` : c}
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
  _startTimer(e) {
    const t = Math.round(this._timerMinutes * 60);
    this._call("scheduled_climate", `start_${e}_timer`, {
      duration: { seconds: t }
    });
  }
  render() {
    if (!this._config || !this.hass) return c;
    const e = this._state;
    if (!e) return p`<ha-card><div class="empty">Entity not found</div></ha-card>`;
    const t = Ne.has(e.state), i = this._config.name ?? e.attributes.friendly_name ?? "Scheduled Climate";
    return p`
      <ha-card>
        <header><div><h2>${i}</h2><p>${t ? "Unavailable" : e.state.replaceAll("_", " ")}</p></div><ha-icon icon="mdi:thermostat"></ha-icon></header>
        ${t ? p`<div class="empty">The climate entity is unavailable.</div>` : this._renderClimate(e)}
        ${!t && this._config.show_schedule !== !1 ? this._renderSchedule(e) : c}
        ${!t && this._config.show_timer !== !1 ? this._renderTimer(e) : c}
        ${this._message ? p`<div class="message" role="status">${this._message}</div>` : c}
      </ha-card>
    `;
  }
};
H.properties = {
  hass: { attribute: !1 },
  _config: { state: !0 },
  _busy: { state: !0 },
  _message: { state: !0 },
  _scheduleEnabled: { state: !0 },
  _onTime: { state: !0 },
  _offTime: { state: !0 },
  _timerMinutes: { state: !0 }
}, H.styles = ne`
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
let V = H;
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
