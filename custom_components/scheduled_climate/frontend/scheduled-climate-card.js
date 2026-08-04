const z = globalThis, V = z.ShadowRoot && (z.ShadyCSS === void 0 || z.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, B = /* @__PURE__ */ Symbol(), Z = /* @__PURE__ */ new WeakMap();
let rt = class {
  constructor(t, e, i) {
    if (this._$cssResult$ = !0, i !== B) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const e = this.t;
    if (V && t === void 0) {
      const i = e !== void 0 && e.length === 1;
      i && (t = Z.get(e)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), i && Z.set(e, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const dt = (o) => new rt(typeof o == "string" ? o : o + "", void 0, B), ot = (o, ...t) => {
  const e = o.length === 1 ? o[0] : t.reduce((i, s, r) => i + ((n) => {
    if (n._$cssResult$ === !0) return n.cssText;
    if (typeof n == "number") return n;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + n + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s) + o[r + 1], o[0]);
  return new rt(e, o, B);
}, pt = (o, t) => {
  if (V) o.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
  else for (const e of t) {
    const i = document.createElement("style"), s = z.litNonce;
    s !== void 0 && i.setAttribute("nonce", s), i.textContent = e.cssText, o.appendChild(i);
  }
}, J = V ? (o) => o : (o) => o instanceof CSSStyleSheet ? ((t) => {
  let e = "";
  for (const i of t.cssRules) e += i.cssText;
  return dt(e);
})(o) : o;
const { is: ut, defineProperty: mt, getOwnPropertyDescriptor: _t, getOwnPropertyNames: gt, getOwnPropertySymbols: ft, getPrototypeOf: $t } = Object, N = globalThis, K = N.trustedTypes, bt = K ? K.emptyScript : "", vt = N.reactiveElementPolyfillSupport, E = (o, t) => o, j = { toAttribute(o, t) {
  switch (t) {
    case Boolean:
      o = o ? bt : null;
      break;
    case Object:
    case Array:
      o = o == null ? o : JSON.stringify(o);
  }
  return o;
}, fromAttribute(o, t) {
  let e = o;
  switch (t) {
    case Boolean:
      e = o !== null;
      break;
    case Number:
      e = o === null ? null : Number(o);
      break;
    case Object:
    case Array:
      try {
        e = JSON.parse(o);
      } catch {
        e = null;
      }
  }
  return e;
} }, nt = (o, t) => !ut(o, t), G = { attribute: !0, type: String, converter: j, reflect: !1, useDefault: !1, hasChanged: nt };
Symbol.metadata ??= /* @__PURE__ */ Symbol("metadata"), N.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let v = class extends HTMLElement {
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
    }, set(n) {
      this[e] = n;
    } };
    return { get: s, set(n) {
      const h = s?.call(this);
      r?.call(this, n), this.requestUpdate(t, h, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? G;
  }
  static _$Ei() {
    if (this.hasOwnProperty(E("elementProperties"))) return;
    const t = $t(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(E("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(E("properties"))) {
      const e = this.properties, i = [...gt(e), ...ft(e)];
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
      const r = (i.converter?.toAttribute !== void 0 ? i.converter : j).toAttribute(e, i.type);
      this._$Em = t, r == null ? this.removeAttribute(s) : this.setAttribute(s, r), this._$Em = null;
    }
  }
  _$AK(t, e) {
    const i = this.constructor, s = i._$Eh.get(t);
    if (s !== void 0 && this._$Em !== s) {
      const r = i.getPropertyOptions(s), n = typeof r.converter == "function" ? { fromAttribute: r.converter } : r.converter?.fromAttribute !== void 0 ? r.converter : j;
      this._$Em = s;
      const h = n.fromAttribute(e, r.type);
      this[s] = h ?? this._$Ej?.get(s) ?? h, this._$Em = null;
    }
  }
  requestUpdate(t, e, i, s = !1, r) {
    if (t !== void 0) {
      const n = this.constructor;
      if (s === !1 && (r = this[t]), i ??= n.getPropertyOptions(t), !((i.hasChanged ?? nt)(r, e) || i.useDefault && i.reflect && r === this._$Ej?.get(t) && !this.hasAttribute(n._$Eu(t, i)))) return;
      this.C(t, e, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, e, { useDefault: i, reflect: s, wrapped: r }, n) {
    i && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t) && (this._$Ej.set(t, n ?? e ?? this[t]), r !== !0 || n !== void 0) || (this._$AL.has(t) || (this.hasUpdated || i || (e = void 0), this._$AL.set(t, e)), s === !0 && this._$Em !== t && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t));
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
        const { wrapped: n } = r, h = this[s];
        n !== !0 || this._$AL.has(s) || h === void 0 || this.C(s, void 0, r, h);
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
v.elementStyles = [], v.shadowRootOptions = { mode: "open" }, v[E("elementProperties")] = /* @__PURE__ */ new Map(), v[E("finalized")] = /* @__PURE__ */ new Map(), vt?.({ ReactiveElement: v }), (N.reactiveElementVersions ??= []).push("2.1.2");
const W = globalThis, Q = (o) => o, U = W.trustedTypes, X = U ? U.createPolicy("lit-html", { createHTML: (o) => o }) : void 0, at = "$lit$", g = `lit$${Math.random().toFixed(9).slice(2)}$`, lt = "?" + g, yt = `<${lt}>`, b = document, T = () => b.createComment(""), C = (o) => o === null || typeof o != "object" && typeof o != "function", q = Array.isArray, xt = (o) => q(o) || typeof o?.[Symbol.iterator] == "function", L = `[ 	
\f\r]`, A = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Y = /-->/g, tt = />/g, f = RegExp(`>|${L}(?:([^\\s"'>=/]+)(${L}*=${L}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), et = /'/g, it = /"/g, ct = /^(?:script|style|textarea|title)$/i, wt = (o) => (t, ...e) => ({ _$litType$: o, strings: t, values: e }), p = wt(1), x = /* @__PURE__ */ Symbol.for("lit-noChange"), l = /* @__PURE__ */ Symbol.for("lit-nothing"), st = /* @__PURE__ */ new WeakMap(), $ = b.createTreeWalker(b, 129);
function ht(o, t) {
  if (!q(o) || !o.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return X !== void 0 ? X.createHTML(t) : t;
}
const At = (o, t) => {
  const e = o.length - 1, i = [];
  let s, r = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", n = A;
  for (let h = 0; h < e; h++) {
    const a = o[h];
    let c, u, d = -1, m = 0;
    for (; m < a.length && (n.lastIndex = m, u = n.exec(a), u !== null); ) m = n.lastIndex, n === A ? u[1] === "!--" ? n = Y : u[1] !== void 0 ? n = tt : u[2] !== void 0 ? (ct.test(u[2]) && (s = RegExp("</" + u[2], "g")), n = f) : u[3] !== void 0 && (n = f) : n === f ? u[0] === ">" ? (n = s ?? A, d = -1) : u[1] === void 0 ? d = -2 : (d = n.lastIndex - u[2].length, c = u[1], n = u[3] === void 0 ? f : u[3] === '"' ? it : et) : n === it || n === et ? n = f : n === Y || n === tt ? n = A : (n = f, s = void 0);
    const _ = n === f && o[h + 1].startsWith("/>") ? " " : "";
    r += n === A ? a + yt : d >= 0 ? (i.push(c), a.slice(0, d) + at + a.slice(d) + g + _) : a + g + (d === -2 ? h : _);
  }
  return [ht(o, r + (o[e] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), i];
};
class k {
  constructor({ strings: t, _$litType$: e }, i) {
    let s;
    this.parts = [];
    let r = 0, n = 0;
    const h = t.length - 1, a = this.parts, [c, u] = At(t, e);
    if (this.el = k.createElement(c, i), $.currentNode = this.el.content, e === 2 || e === 3) {
      const d = this.el.content.firstChild;
      d.replaceWith(...d.childNodes);
    }
    for (; (s = $.nextNode()) !== null && a.length < h; ) {
      if (s.nodeType === 1) {
        if (s.hasAttributes()) for (const d of s.getAttributeNames()) if (d.endsWith(at)) {
          const m = u[n++], _ = s.getAttribute(d).split(g), M = /([.?@])?(.*)/.exec(m);
          a.push({ type: 1, index: r, name: M[2], strings: _, ctor: M[1] === "." ? St : M[1] === "?" ? Tt : M[1] === "@" ? Ct : R }), s.removeAttribute(d);
        } else d.startsWith(g) && (a.push({ type: 6, index: r }), s.removeAttribute(d));
        if (ct.test(s.tagName)) {
          const d = s.textContent.split(g), m = d.length - 1;
          if (m > 0) {
            s.textContent = U ? U.emptyScript : "";
            for (let _ = 0; _ < m; _++) s.append(d[_], T()), $.nextNode(), a.push({ type: 2, index: ++r });
            s.append(d[m], T());
          }
        }
      } else if (s.nodeType === 8) if (s.data === lt) a.push({ type: 2, index: r });
      else {
        let d = -1;
        for (; (d = s.data.indexOf(g, d + 1)) !== -1; ) a.push({ type: 7, index: r }), d += g.length - 1;
      }
      r++;
    }
  }
  static createElement(t, e) {
    const i = b.createElement("template");
    return i.innerHTML = t, i;
  }
}
function w(o, t, e = o, i) {
  if (t === x) return t;
  let s = i !== void 0 ? e._$Co?.[i] : e._$Cl;
  const r = C(t) ? void 0 : t._$litDirective$;
  return s?.constructor !== r && (s?._$AO?.(!1), r === void 0 ? s = void 0 : (s = new r(o), s._$AT(o, e, i)), i !== void 0 ? (e._$Co ??= [])[i] = s : e._$Cl = s), s !== void 0 && (t = w(o, s._$AS(o, t.values), s, i)), t;
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
    $.currentNode = s;
    let r = $.nextNode(), n = 0, h = 0, a = i[0];
    for (; a !== void 0; ) {
      if (n === a.index) {
        let c;
        a.type === 2 ? c = new P(r, r.nextSibling, this, t) : a.type === 1 ? c = new a.ctor(r, a.name, a.strings, this, t) : a.type === 6 && (c = new kt(r, this, t)), this._$AV.push(c), a = i[++h];
      }
      n !== a?.index && (r = $.nextNode(), n++);
    }
    return $.currentNode = b, s;
  }
  p(t) {
    let e = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(t, i, e), e += i.strings.length - 2) : i._$AI(t[e])), e++;
  }
}
class P {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t, e, i, s) {
    this.type = 2, this._$AH = l, this._$AN = void 0, this._$AA = t, this._$AB = e, this._$AM = i, this.options = s, this._$Cv = s?.isConnected ?? !0;
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
    t = w(this, t, e), C(t) ? t === l || t == null || t === "" ? (this._$AH !== l && this._$AR(), this._$AH = l) : t !== this._$AH && t !== x && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : xt(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== l && C(this._$AH) ? this._$AA.nextSibling.data = t : this.T(b.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    const { values: e, _$litType$: i } = t, s = typeof i == "number" ? this._$AC(t) : (i.el === void 0 && (i.el = k.createElement(ht(i.h, i.h[0]), this.options)), i);
    if (this._$AH?._$AD === s) this._$AH.p(e);
    else {
      const r = new Et(s, this), n = r.u(this.options);
      r.p(e), this.T(n), this._$AH = r;
    }
  }
  _$AC(t) {
    let e = st.get(t.strings);
    return e === void 0 && st.set(t.strings, e = new k(t)), e;
  }
  k(t) {
    q(this._$AH) || (this._$AH = [], this._$AR());
    const e = this._$AH;
    let i, s = 0;
    for (const r of t) s === e.length ? e.push(i = new P(this.O(T()), this.O(T()), this, this.options)) : i = e[s], i._$AI(r), s++;
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
    this.type = 1, this._$AH = l, this._$AN = void 0, this.element = t, this.name = e, this._$AM = s, this.options = r, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = l;
  }
  _$AI(t, e = this, i, s) {
    const r = this.strings;
    let n = !1;
    if (r === void 0) t = w(this, t, e, 0), n = !C(t) || t !== this._$AH && t !== x, n && (this._$AH = t);
    else {
      const h = t;
      let a, c;
      for (t = r[0], a = 0; a < r.length - 1; a++) c = w(this, h[i + a], e, a), c === x && (c = this._$AH[a]), n ||= !C(c) || c !== this._$AH[a], c === l ? t = l : t !== l && (t += (c ?? "") + r[a + 1]), this._$AH[a] = c;
    }
    n && !s && this.j(t);
  }
  j(t) {
    t === l ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class St extends R {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === l ? void 0 : t;
  }
}
class Tt extends R {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== l);
  }
}
class Ct extends R {
  constructor(t, e, i, s, r) {
    super(t, e, i, s, r), this.type = 5;
  }
  _$AI(t, e = this) {
    if ((t = w(this, t, e, 0) ?? l) === x) return;
    const i = this._$AH, s = t === l && i !== l || t.capture !== i.capture || t.once !== i.once || t.passive !== i.passive, r = t !== l && (i === l || s);
    s && this.element.removeEventListener(this.name, this, i), r && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class kt {
  constructor(t, e, i) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = e, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    w(this, t);
  }
}
const Pt = W.litHtmlPolyfillSupport;
Pt?.(k, P), (W.litHtmlVersions ??= []).push("3.3.3");
const Mt = (o, t, e) => {
  const i = e?.renderBefore ?? t;
  let s = i._$litPart$;
  if (s === void 0) {
    const r = e?.renderBefore ?? null;
    i._$litPart$ = s = new P(t.insertBefore(T(), r), r, void 0, e ?? {});
  }
  return s._$AI(o), s;
};
const F = globalThis;
class y extends v {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t.firstChild, t;
  }
  update(t) {
    const e = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = Mt(e, this.renderRoot, this.renderOptions);
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
y._$litElement$ = !0, y.finalized = !0, F.litElementHydrateSupport?.({ LitElement: y });
const zt = F.litElementPolyfillSupport;
zt?.({ LitElement: y });
(F.litElementVersions ??= []).push("4.2.2");
const S = [15, 30, 60, 120], O = class O extends y {
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
    if (!this.hass || !this._config) return l;
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
O.properties = {
  hass: { attribute: !1 },
  _config: { state: !0 }
}, O.styles = ot`
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
let D = O;
customElements.define("scheduled-climate-card-editor", D);
const Ut = /* @__PURE__ */ new Set(["unavailable", "unknown"]), H = class H extends y {
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
    if (!this.hass || !this._config || this._busy) return !1;
    this._busy = !0, this._message = "";
    try {
      return await this.hass.callService(t, e, {
        entity_id: this._config.entity,
        ...i
      }), this._message = "Saved", !0;
    } catch (s) {
      return this._message = s instanceof Error ? s.message : "Command failed", !1;
    } finally {
      this._busy = !1;
    }
  }
  _formatValue(t, e = "") {
    return typeof t == "number" ? `${t}${e}` : "--";
  }
  _modeIcon(t) {
    return {
      off: "mdi:power",
      heat: "mdi:fire",
      cool: "mdi:snowflake",
      heat_cool: "mdi:autorenew",
      auto: "mdi:calendar-sync",
      dry: "mdi:water-percent",
      fan_only: "mdi:fan"
    }[t] ?? "mdi:thermostat";
  }
  _adjustTemperature(t, e, i) {
    const s = this._state;
    if (!s) return;
    const r = s.attributes, n = {
      [t]: Math.round((e + i) * 100) / 100
    };
    t === "target_temp_low" && (n.target_temp_high = r.target_temp_high), t === "target_temp_high" && (n.target_temp_low = r.target_temp_low), this._call("climate", "set_temperature", n);
  }
  _renderTemperatureControl(t, e, i, s, r, n, h) {
    return p`
      <div class="number-control" aria-label=${t}>
        <button
          class="step-button"
          title=${`Decrease ${t.toLowerCase()}`}
          aria-label=${`Decrease ${t.toLowerCase()}`}
          ?disabled=${this._busy || i - r < n}
          @click=${() => this._adjustTemperature(e, i, -r)}
        ><ha-icon icon="mdi:minus"></ha-icon></button>
        <div class="target-value">
          <span>${i}</span><small>${s}</small>
          <label>${t}</label>
        </div>
        <button
          class="step-button"
          title=${`Increase ${t.toLowerCase()}`}
          aria-label=${`Increase ${t.toLowerCase()}`}
          ?disabled=${this._busy || i + r > h}
          @click=${() => this._adjustTemperature(e, i, r)}
        ><ha-icon icon="mdi:plus"></ha-icon></button>
      </div>
    `;
  }
  _renderSelect(t, e, i, s, r) {
    return i?.length ? p`
      <label class="field">
        <span>${t}</span>
        <select
          .value=${e ?? ""}
          ?disabled=${this._busy}
          @change=${(n) => this._call("climate", s, {
      [r]: n.target.value
    })}
        >
          ${i.map((n) => p`<option value=${n}>${n.replaceAll("_", " ")}</option>`)}
        </select>
      </label>
    ` : l;
  }
  _renderClimate(t) {
    const e = t.attributes, i = String(e.unit_of_measurement ?? "°"), s = e.hvac_modes ?? [], r = e.temperature, n = e.target_temp_low, h = e.target_temp_high, a = e.target_temp_step ?? 0.5;
    return p`
      <section class="climate" aria-label="Climate controls">
        <div class=${`thermostat ${t.state === "off" ? "is-off" : "is-active"}`}>
          <div class="dial-ring">
            <div class="dial-content">
              <span class="current-label">Current</span>
              <span class="current">${this._formatValue(e.current_temperature, i)}</span>
              ${e.hvac_action ? p`<span class="action"><span class="pulse"></span>${e.hvac_action.replaceAll("_", " ")}</span>` : l}
            </div>
          </div>
        </div>
        ${typeof r == "number" ? this._renderTemperatureControl(
      "Target",
      "temperature",
      r,
      i,
      a,
      e.min_temp ?? 7,
      e.max_temp ?? 35
    ) : typeof n == "number" && typeof h == "number" ? p`<div class="range-target" aria-label="Target temperature range">
                ${this._renderTemperatureControl(
      "Low",
      "target_temp_low",
      n,
      i,
      a,
      e.min_temp ?? 7,
      h
    )}
                ${this._renderTemperatureControl(
      "High",
      "target_temp_high",
      h,
      i,
      a,
      n,
      e.max_temp ?? 35
    )}
              </div>` : l}
        <div class="modes feature-buttons" role="group" aria-label="HVAC mode">
          ${s.map(
      (c) => p`
              <button
                class=${t.state === c ? "selected" : ""}
                ?disabled=${this._busy}
                aria-pressed=${t.state === c}
                @click=${() => this._call("climate", "set_hvac_mode", { hvac_mode: c })}
              ><ha-icon icon=${this._modeIcon(c)}></ha-icon><span>${c.replaceAll("_", " ")}</span></button>
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
                    @change=${(c) => this._call("climate", "set_humidity", {
      humidity: Number(c.target.value)
    })}
                  />
                </label>
              ` : l}
        </div>
      </section>
    `;
  }
  _renderSchedule(t) {
    const e = this._scheduleEnabled ? t.attributes.next_schedule_action : null, i = this._scheduleEnabled ? t.attributes.next_schedule_time : null;
    return p`
      <section aria-labelledby="schedule-heading">
        <div class="section-heading">
          <ha-icon class="section-icon" icon="mdi:calendar-clock"></ha-icon>
          <div class="section-copy">
            <h3 id="schedule-heading">Daily schedule</h3>
            <p>${e && i ? `Next ${e} · ${new Date(i).toLocaleString()}` : "No action scheduled"}</p>
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
  async _scheduleEnabledChanged(t) {
    const e = this._onTime, i = this._offTime;
    this._scheduleEnabled = t, !t && (this._onTime = "", this._offTime = "", await this._call("scheduled_climate", "update_schedule", {
      schedule_enabled: !1,
      on_time: null,
      off_time: null
    }) || (this._scheduleEnabled = !0, this._onTime = e, this._offTime = i));
  }
  _renderTimer(t) {
    const e = t.attributes.timer_action, i = t.attributes.timer_deadline, s = this._config?.timer_presets ?? S;
    return p`
      <section aria-labelledby="timer-heading">
        <div class="section-heading">
          <ha-icon class="section-icon" icon="mdi:timer-outline"></ha-icon>
          <div class="section-copy"><h3 id="timer-heading">Timer</h3><p>${e && i ? `${e} at ${new Date(i).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "No active timer"}</p></div>
          ${e ? p`<button class="icon" title="Cancel timer" aria-label="Cancel timer" @click=${() => this._call("scheduled_climate", "cancel_timer")}><ha-icon icon="mdi:timer-off-outline"></ha-icon></button>` : l}
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
    if (!this._config || !this.hass) return l;
    const t = this._state;
    if (!t) return p`<ha-card><div class="empty">Entity not found</div></ha-card>`;
    const e = Ut.has(t.state), i = this._config.name ?? t.attributes.friendly_name ?? "Scheduled Climate";
    return p`
      <ha-card class=${`state-${t.state}`}>
        <header>
          <div class="title-block"><h2>${i}</h2><p>${e ? "Unavailable" : t.state.replaceAll("_", " ")}</p></div>
          <button class="more-info icon" title="More information" aria-label="More information" @click=${this._showMoreInfo}>
            <ha-icon icon="mdi:dots-vertical"></ha-icon>
          </button>
        </header>
        ${e ? p`<div class="empty">The climate entity is unavailable.</div>` : this._renderClimate(t)}
        ${!e && this._config.show_schedule !== !1 ? this._renderSchedule(t) : l}
        ${!e && this._config.show_timer !== !1 ? this._renderTimer(t) : l}
        ${this._message ? p`<div class="message" role="status">${this._message}</div>` : l}
      </ha-card>
    `;
  }
  _showMoreInfo() {
    this._config && this.dispatchEvent(new CustomEvent("hass-more-info", {
      bubbles: !0,
      composed: !0,
      detail: { entityId: this._config.entity }
    }));
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
}, H.styles = ot`
    :host { display: block; color: var(--primary-text-color); --feature-color: var(--state-climate-heat-color, var(--primary-color)); }
    ha-card { overflow: hidden; border-radius: var(--ha-card-border-radius, var(--ha-border-radius-lg, 12px)); }
    ha-card.state-cool { --feature-color: var(--state-climate-cool-color, #2196f3); }
    ha-card.state-dry { --feature-color: var(--state-climate-dry-color, #f9a825); }
    ha-card.state-fan_only { --feature-color: var(--state-climate-fan_only-color, #8e8e93); }
    ha-card.state-off { --feature-color: var(--state-climate-off-color, var(--state-inactive-color, #9e9e9e)); }
    header, section { padding: 16px 20px; }
    header { position: relative; min-height: 50px; display: flex; justify-content: center; align-items: center; box-sizing: border-box; }
    .title-block { min-width: 0; text-align: center; }
    .title-block p { text-transform: capitalize; }
    .more-info { position: absolute; right: 8px; inset-inline-end: 8px; border: 0; border-radius: var(--ha-border-radius-pill, 999px); color: var(--secondary-text-color); background: transparent; }
    h2, h3, p { margin: 0; letter-spacing: 0; }
    h2 { overflow: hidden; font-size: var(--ha-font-size-l, 18px); line-height: var(--ha-line-height-expanded, 1.4); text-overflow: ellipsis; white-space: nowrap; }
    h3 { font-size: var(--ha-font-size-m, 14px); line-height: 1.4; }
    p, .caption, .field > span, .custom-time > span { color: var(--secondary-text-color); font-size: 12px; }
    section + section { border-top: 1px solid var(--divider-color); }
    .climate { padding-top: 4px; }
    .thermostat { display: grid; place-items: center; padding: 8px 0 14px; }
    .dial-ring { width: min(230px, 68vw); aspect-ratio: 1; display: grid; place-items: center; border: 12px solid color-mix(in srgb, var(--feature-color) 72%, var(--card-background-color)); border-right-color: color-mix(in srgb, var(--feature-color) 16%, var(--card-background-color)); border-radius: 50%; box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--feature-color) 18%, transparent); box-sizing: border-box; }
    .is-off .dial-ring { border-color: color-mix(in srgb, var(--secondary-text-color) 22%, var(--card-background-color)); }
    .dial-content { display: grid; justify-items: center; gap: 3px; }
    .current-label { color: var(--secondary-text-color); font-size: 12px; }
    .current { font-size: 48px; line-height: 1.05; font-weight: 400; font-variant-numeric: tabular-nums; }
    .action { display: flex; align-items: center; gap: 6px; color: var(--secondary-text-color); font-size: 12px; text-transform: capitalize; }
    .pulse { width: 7px; height: 7px; border-radius: 50%; background: var(--state-climate-heat-color, var(--primary-color)); }
    .number-control { display: grid; grid-template-columns: 44px minmax(80px, 1fr) 44px; align-items: center; max-width: 260px; margin: 0 auto; border: 1px solid var(--divider-color); border-radius: var(--ha-border-radius-pill, 999px); overflow: hidden; }
    .target-value { display: grid; grid-template-columns: auto auto; justify-content: center; align-items: start; padding: 5px 8px; text-align: center; }
    .target-value span { font-size: 22px; font-variant-numeric: tabular-nums; }
    .target-value small { padding-top: 2px; font-size: 12px; }
    .target-value label { grid-column: 1 / -1; color: var(--secondary-text-color); font-size: 10px; }
    .range-target { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .range-target .number-control { grid-template-columns: 36px minmax(56px, 1fr) 36px; width: 100%; }
    .modes, .presets { display: flex; gap: 8px; overflow-x: auto; margin-top: 16px; padding-bottom: 2px; scrollbar-width: thin; }
    button { min-height: 40px; padding: 8px 12px; border: 1px solid var(--divider-color); border-radius: var(--ha-border-radius-pill, 999px); color: var(--primary-text-color); background: var(--card-background-color); font: inherit; cursor: pointer; text-transform: capitalize; white-space: nowrap; }
    button:hover { background: color-mix(in srgb, var(--primary-color) 8%, var(--card-background-color)); }
    button:focus-visible, input:focus-visible, select:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
    button.selected, button.primary { color: var(--text-primary-color, white); background: var(--feature-color); border-color: var(--feature-color); }
    button:disabled { opacity: .55; cursor: wait; }
    button ha-icon { --mdc-icon-size: 18px; margin-right: 6px; vertical-align: -4px; }
    .step-button { min-height: 44px; padding: 8px; border: 0; border-radius: 0; color: var(--feature-color); background: transparent; }
    .step-button ha-icon, .icon ha-icon { margin: 0; }
    .feature-buttons button { display: grid; min-width: 64px; justify-items: center; gap: 3px; padding: 7px 12px; font-size: 11px; }
    .feature-buttons button ha-icon { --mdc-icon-size: 20px; margin: 0; }
    .control-grid, .schedule-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 16px; padding: 12px; border-radius: var(--ha-border-radius-lg, 12px); background: var(--secondary-background-color, color-mix(in srgb, var(--primary-text-color) 5%, var(--card-background-color))); }
    .field { display: grid; gap: 5px; }
    input, select { box-sizing: border-box; min-width: 0; min-height: 40px; padding: 7px 10px; color: var(--primary-text-color); background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: var(--ha-border-radius-md, 8px); font: inherit; }
    input[type="checkbox"] { accent-color: var(--primary-color); }
    .section-heading { display: flex; align-items: center; gap: 12px; }
    .section-icon { --mdc-icon-size: 22px; flex: 0 0 auto; padding: 9px; border-radius: 50%; color: var(--feature-color); background: color-mix(in srgb, var(--feature-color) 12%, var(--card-background-color)); }
    .section-copy { min-width: 0; flex: 1; }
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
      .current { font-size: 42px; }
      .custom-time { margin-left: 0; }
      .range-target { grid-template-columns: 1fr; }
      .presets { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); overflow-x: visible; }
      .presets > button { min-width: 0; padding-inline: 6px; }
      .custom-time { grid-column: 1 / -1; width: 100%; }
      .custom-time input { flex: 1; width: auto; }
    }
  `;
let I = H;
customElements.define("scheduled-climate-card", I);
window.customCards = window.customCards ?? [];
window.customCards.push({
  type: "scheduled-climate-card",
  name: "Scheduled Climate Card",
  description: "Climate controls with daily schedules and one-shot timers.",
  preview: !0
});
export {
  I as ScheduledClimateCard
};
