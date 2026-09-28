/* ============================================================ backend adapter
   Everything the app needs from its host goes through Backend: who is viewing,
   loading/saving the viewer's documents, asking Claude, and saving files.
   Today the host is the claude.ai artifact runtime; a standalone app would swap
   this file (e.g. IndexedDB + an API proxy) and keep the rest unchanged. */
const Backend = {
  kind: "none", uid: null, isOwner: false,
  caps: { db: false, user: false, sample: false, downloads: false },
  _db: null, _sample: null, _downloads: null,

  async init() {
    const c = window.claude;
    if (!c || typeof c.use !== "function") { this.kind = "local"; this.uid = "local"; return; }
    const use = (n) => withTimeout(c.use(n).catch(() => null), 12000, null);
    const [db, user, sample, downloads] = await Promise.all([use("db"), use("user"), use("sample"), use("downloads")]);
    this._db = db; this._sample = sample; this._downloads = downloads;
    this.caps = { db: !!db, user: !!user, sample: !!sample, downloads: !!downloads };
    if (user) {
      try { this.uid = await user.id(); } catch (e) { this.uid = null; }
      try { this.isOwner = await user.isOwner(); } catch (e) { this.isOwner = false; }
    }
    this.kind = db && this.uid ? "cloud" : db ? "noid" : "local";
    if (this.kind === "local") this.uid = "local";
  },
  base() { return "data/users/" + this.uid; },

  /* every document in the viewer's own space, as plain (unfrozen) objects */
  async loadAll() {
    if (this.kind === "local") return localLoad();
    const out = {};
    try {
      const snap = await this._db.collection(this.base()).get();
      snap.docs.forEach((d) => { if (d.exists) out[d.id] = clone(d.data()); });
      return out;
    } catch (e) {
      /* fall back to the documents we know by name; piece names come from the issue list */
      const get = async (names) => { const snaps = await Promise.all(names.map((n) => this._db.doc(this.base() + "/" + n).get().catch(() => null))); snaps.forEach((d, i) => { if (d && d.exists) out[names[i]] = clone(d.data()); }); };
      await get(["b_book", "b_issues", "b_scenes", "b_atlas"]);
      await get(((out.b_issues && out.b_issues.items) || []).map((x) => "b_p_" + x.id));
      return out;
    }
  },
  async readShared(path) {
    if (this.kind !== "cloud") return null;
    const d = await this._db.doc(path).get();
    return d.exists ? clone(d.data()) : null;
  },
  async save(name, data) {
    if (this.kind === "local") return localSave(name, data);
    if (this.kind !== "cloud") throw { code: "no_store" };
    await this._db.doc(this.base() + "/" + name).set(data);
  },

  async remove(name) {
    if (this.kind === "local") { try { localStorage.removeItem(LS_KEY + name); } catch (e) { /* storage blocked */ } return; }
    const ref = this._db.doc(this.base() + "/" + name);
    if (typeof ref.delete === "function") return ref.delete();
    return ref.set({ gone: true });
  },

  aiAvailable() { return !!this._sample; },
  async aiJSON(input, opts) { return this._sample.json(input, opts); },

  async download(filename, data) {
    if (!this._downloads) throw { code: "unavailable" };
    return this._downloads.save({ filename, data });
  },
};

/* local fallback (preview outside claude.ai): this browser only */
const LS_KEY = "book.v1.";
function localLoad() {
  const out = {};
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(LS_KEY)) out[k.slice(LS_KEY.length)] = JSON.parse(localStorage.getItem(k)); } } catch (e) { /* storage blocked */ }
  return out;
}
function localSave(name, data) {
  try { localStorage.setItem(LS_KEY + name, JSON.stringify(data)); } catch (e) { throw { code: "local_storage", message: String(e && e.message) }; }
}
