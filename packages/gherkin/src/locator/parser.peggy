// Locator grammar
// Supports:
// - role/tag (#id optional)
// - field / image / text special cases
// - id-only selectors
// - raw locators in backticks
// - with / without / within
//
// Example:
//   button "Submit" within form #checkout
//   section with button "submit" within #main
//   section without text "ads" within `css=.foo >> nth(2)`

{
  function addId(selector, id) {
    if (!id) return selector;
    selector.id = id;
    return selector;
  }
}

Start
  = _ e:Expr _ { return e; }

Expr
  = base:WithExpr rest:(_ "within"i ![a-zA-Z] _ s:Selector { return s; })*
    { return { type: "Within", base, ancestors: rest ?? [] }; }

WithExpr
  = sel:Selector parts:(_ wp:WithPart { return wp; })*
    {
      const include = [], exclude = [];
      for (const x of parts) {
        (x.incl ? include : exclude).push(x.p);
      }
      return { type: "With", selector: sel, include, exclude };
    }

WithPart
  = "with"i ![a-zA-Z] _ p:Predicate { return { incl: true, p }; }
  / "without"i ![a-zA-Z] _ p:Predicate { return { incl: false, p }; }

// ---------- Selectors ----------

Selector
  = RawSel
  / RoleWithOpt
  / TagWithOpt
  / IdOnly

// Raw Playwright locator in backticks
RawSel
  = "`" s:RawChars "`"
    { return { type: "Selector", mode: "raw", raw: s.trim() }; }
RawChars
  = $([^`]*)

// Role-first: role or special (field, image, text)
RoleWithOpt
  = TheOpt? base:RoleSel id:IdSuffix?
    {
      const s = { type: "Selector", mode: "role", role: base.role, name: base.name };
      return addId(s, id ?? null);
    }

// Role selection rules with disambiguation:
// - If the identifier is a known role keyword (button, link, field, image, text), it's a role.
// - Otherwise, it is treated as a role only when followed by a quoted name.
RoleSel
  = // Known roles may optionally have a name
    r:KnownRole _ n:StringLit? { return { role: r, name: n ?? null }; }
  / // Generic role: only considered a role when it has a quoted name
    r:Ident _ n:StringLit       { return { role: r, name: n }; }

KnownRole
  = "button"i / "link"i / "field"i / "image"i / "text"i

// Tag-first (e.g. div, section, button)
TagWithOpt
  = TheOpt? t:TagSel id:IdSuffix?
    {
      const s = { type: "Selector", mode: "tag", tag: t };
      return addId(s, id ?? null);
    }

TagSel
  = Ident

// #id as standalone selector (e.g., within #main)
IdOnly
  = "#" i:Ident
    { return { type:"Selector", mode:"idonly", id: "#"+i }; }

// Optional #id suffix (e.g., form #login)
IdSuffix
  = _ "#" i:Ident { return "#"+i; }

// ---------- Predicates ----------

Predicate
  = sel:Selector { return { type: "HasDescendant", selector: sel }; }

// ---------- Lexical ----------

TheOpt
  = "the"i ![a-zA-Z] _

Ident
  = $([a-zA-Z_][a-zA-Z0-9_-]*)

StringLit
  = "\"" chars:($(("\\\"" / !("\"") .))* ) "\""
    { return chars; }

_ = [ \t\r\n]*
